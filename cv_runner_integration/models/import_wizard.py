import requests
import json
from datetime import datetime
from odoo import models, fields, api
from odoo.exceptions import UserError


class CvImportWizard(models.TransientModel):
    """
    Transient model = wizard — a temporary form that runs an action
    and disappears. Used for the "Import from CV Runner" action.
    """
    _name = 'cv.import.wizard'
    _description = 'Import Position from CV Runner'

    api_token = fields.Char(
        string='API Token',
        required=True,
        help='The token generated on the position page in CV Runner',
    )
    # This should match your deployed Next.js app URL
    api_url = fields.Char(
        string='CV Runner URL',
        default='https://cv-runner-2077.vercel.app',  # ← put your real URL here
        required=True,
        )

    def action_import(self):
        """
        Fetch position data from CV Runner API and create/update
        the cv.position record in Odoo.
        """
        self.ensure_one()

        endpoint = f"{self.api_url.rstrip('/')}/api/positions/export"

        try:
            response = requests.get(
                endpoint,
                headers={'x-api-token': self.api_token},
                timeout=15,
            )
        except requests.exceptions.ConnectionError:
            raise UserError(
                f"Could not connect to CV Runner at {self.api_url}. "
                "Check that the URL is correct and the app is running."
            )
        except requests.exceptions.Timeout:
            raise UserError("Request timed out. CV Runner took too long to respond.")

        if response.status_code == 401:
            raise UserError("Invalid API token. Generate a new one from the position page.")
        if response.status_code == 404:
            raise UserError("Position not found. The token may belong to a deleted position.")
        if not response.ok:
            raise UserError(f"CV Runner API error: {response.status_code} — {response.text}")

        data = response.json()
        pos_data = data.get('position', {})
        attributes = data.get('attributes', [])
        total_cvs = data.get('totalPublishedCVs', 0)

        # Check if this position was already imported (match by token)
        existing = self.env['cv.position'].search(
            [('api_token', '=', self.api_token)], limit=1
        )

        # Build aggregation summaries for each attribute
        attribute_vals = []
        for attr in attributes:
            summary = self._format_aggregation(attr)
            attribute_vals.append((0, 0, {
                'name': attr.get('name', ''),
                'attribute_type': attr.get('type', ''),
                'total_responses': attr.get('totalResponses', 0),
                'aggregation_summary': summary,
            }))

        position_vals = {
            'name': pos_data.get('title', 'Unknown'),
            'description': pos_data.get('description', ''),
            'is_public': pos_data.get('isPublic', True),
            'total_cvs': total_cvs,
            'project_tags': ', '.join(pos_data.get('projectTags', [])),
            'external_id': pos_data.get('id', ''),
            'api_token': self.api_token,
            'import_date': datetime.now(),
        }

        if existing:
            # Update existing record — first delete old attributes, then recreate
            existing.attribute_ids.unlink()
            position_vals['attribute_ids'] = attribute_vals
            existing.write(position_vals)
            position = existing
        else:
            # Create new record
            position_vals['attribute_ids'] = attribute_vals
            position = self.env['cv.position'].create(position_vals)

        # Open the imported position record
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'cv.position',
            'res_id': position.id,
            'view_mode': 'form',
            'target': 'current',
        }

    def _format_aggregation(self, attr: dict) -> str:
        """
        Converts the aggregation dict from the API into a readable string
        for display in Odoo.
        """
        agg = attr.get('aggregation', {})
        attr_type = attr.get('type', '')
        total = attr.get('totalResponses', 0)

        if not agg or 'note' in agg:
            return agg.get('note', 'No data')

        if attr_type == 'NUMERIC':
            return (
                f"Responses: {agg.get('count', total)}\n"
                f"Average: {agg.get('average', 'N/A')}\n"
                f"Min: {agg.get('min', 'N/A')}\n"
                f"Max: {agg.get('max', 'N/A')}"
            )

        if attr_type == 'BOOLEAN':
            return (
                f"Yes: {agg.get('true', 0)} ({agg.get('truePercent', 0)}%)\n"
                f"No: {agg.get('false', 0)}"
            )

        if 'topValues' in agg:
            lines = [f"Top values (out of {agg.get('totalUnique', '?')} unique):"]
            for entry in agg.get('topValues', []):
                lines.append(f"  • {entry['value']}: {entry['count']} responses")
            return '\n'.join(lines)

        if 'totalFilled' in agg:
            return f"Filled: {agg.get('totalFilled', total)}"

        return str(agg)