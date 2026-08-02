import requests
from odoo import models, fields, api
from odoo.exceptions import UserError


class CvAttributeSelection(models.TransientModel):
    """
    Represents one attribute selected for export to CV Runner.
    Each row has the attribute's CV Runner ID and display name.
    """
    _name = 'cv.attribute.selection'
    _description = 'CV Runner Attribute Selection'

    wizard_id = fields.Many2one(
        comodel_name='cv.export.wizard',
        string='Wizard',
        ondelete='cascade',
    )
    attribute_id = fields.Char(
        string='Attribute ID',
        required=True,
    )
    attribute_name = fields.Char(
        string='Attribute Name',
        readonly=True,
    )
    attribute_type = fields.Char(
        string='Type',
        readonly=True,
    )
    selected = fields.Boolean(
        string='Include',
        default=False,
    )


class CvExportWizard(models.TransientModel):
    """
    Wizard for creating a position in CV Runner from Odoo.
    Step 1: fill in basic position info
    Step 2: load attributes from CV Runner
    Step 3: select which attributes to include
    Step 4: export
    """
    _name = 'cv.export.wizard'
    _description = 'Export Position to CV Runner'

    # Connection settings
    api_url = fields.Char(
        string='CV Runner URL',
        default='https://cv-runner-2077.vercel.app',
        required=True,
    )
    admin_key = fields.Char(
        string='Admin API Key',
        required=True,
        help='The ADMIN_API_KEY value from your CV Runner .env file',
    )

    # Position details
    title = fields.Char(
        string='Position Title',
        required=True,
    )
    description = fields.Text(
        string='Description',
        required=True,
    )
    is_public = fields.Boolean(
        string='Public',
        default=True,
    )
    max_projects = fields.Integer(
        string='Max Projects in CV',
        default=3,
    )
    project_tags = fields.Char(
        string='Project Tags',
        help='Comma-separated list, e.g. python, sql, react',
    )

    # Attributes loaded from CV Runner
    attribute_ids = fields.One2many(
        comodel_name='cv.attribute.selection',
        inverse_name='wizard_id',
        string='Attributes',
    )
    attributes_loaded = fields.Boolean(
        default=False,
    )

    # Result after export
    created_position_id = fields.Char(
        string='Created Position ID',
        readonly=True,
    )
    created_position_url = fields.Char(
        string='Position URL',
        readonly=True,
    )

    def _get_headers(self):
        return {
            'x-admin-key': self.admin_key,
            'Content-Type': 'application/json',
        }

    def action_load_attributes(self):
        """
        Fetch available attributes from CV Runner so the user
        can select which ones to include in the position.
        """
        self.ensure_one()

        url = f"{self.api_url.rstrip('/')}/api/attributes"
        try:
            res = requests.get(url, headers=self._get_headers(), timeout=10)
        except requests.exceptions.ConnectionError:
            raise UserError(
                f"Could not connect to CV Runner at {self.api_url}."
            )

        if res.status_code == 401:
            raise UserError("Invalid Admin API Key.")
        if not res.ok:
            raise UserError(f"CV Runner error: {res.status_code} — {res.text}")

        data = res.json()
        attributes = data.get('attributes', [])

        # Clear existing selections and create new ones
        self.attribute_ids.unlink()
        selections = []
        for attr in attributes:
            # Skip built-in attributes — they're always on the Me tab,
            # not meant to be selected for position templates
            if attr.get('isBuiltIn'):
                continue
            selections.append((0, 0, {
                'attribute_id': attr['id'],
                'attribute_name': attr['name'],
                'attribute_type': attr['type'],
                'selected': False,
            }))

        self.write({
            'attribute_ids': selections,
            'attributes_loaded': True,
        })

        # Return the same wizard — keeps it open for the user
        # to select attributes before exporting
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'cv.export.wizard',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }

    def action_export(self):
        """
        POST the position data to CV Runner and create the position.
        """
        self.ensure_one()

        selected_ids = self.attribute_ids.filtered(
            lambda a: a.selected
        ).mapped('attribute_id')

        # Parse project tags from comma-separated string
        project_tags = []
        if self.project_tags:
            project_tags = [
                t.strip().lower()
                for t in self.project_tags.split(',')
                if t.strip()
            ]

        payload = {
            'title': self.title,
            'description': self.description,
            'isPublic': self.is_public,
            'maxProjects': self.max_projects,
            'projectTags': project_tags,
            'attributes': selected_ids,
        }

        url = f"{self.api_url.rstrip('/')}/api/positions/import"
        try:
            res = requests.post(
                url,
                headers=self._get_headers(),
                json=payload,
                timeout=15,
            )
        except requests.exceptions.ConnectionError:
            raise UserError(
                f"Could not connect to CV Runner at {self.api_url}."
            )

        if res.status_code == 401:
            raise UserError("Invalid Admin API Key.")
        if not res.ok:
            raise UserError(
                f"Failed to create position in CV Runner: "
                f"{res.status_code} — {res.text}"
            )

        result = res.json()
        position = result.get('position', {})

        self.write({
            'created_position_id': position.get('id', ''),
            'created_position_url': position.get('url', ''),
        })

        # Show success message with link
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'cv.export.wizard',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
        }