from odoo import models, fields

class CvPosition(models.Model):
    """
    Stores a position imported from CV Runner.
    One record per imported position.
    """
    _name = 'cv.position'
    _description = 'CV Runner Position'
    _order = 'import_date desc'

    # Basic position info
    name = fields.Char(
        string='Position Title',
        required=True,
        readonly=True,
    )
    description = fields.Text(
        string='Description',
        readonly=True,
    )
    is_public = fields.Boolean(
        string='Public',
        readonly=True,
    )
    total_cvs = fields.Integer(
        string='Published CVs',
        readonly=True,
    )
    project_tags = fields.Char(
        string='Project Tags',
        readonly=True,
        help='Comma-separated list of project filter tags',
    )
    external_id = fields.Char(
        string='External Position ID',
        readonly=True,
    )
    api_token = fields.Char(
        string='API Token',
        required=True,
    )
    import_date = fields.Datetime(
        string='Last Imported',
        readonly=True,
    )

    # One position has many attributes
    attribute_ids = fields.One2many(
        comodel_name='cv.position.attribute',
        inverse_name='position_id',
        string='Attributes',
        readonly=True,
    )


class CvPositionAttribute(models.Model):
    """
    One row per attribute of an imported position.
    Stores the attribute definition and its aggregated results.
    """
    _name = 'cv.position.attribute'
    _description = 'CV Runner Position Attribute'
    _order = 'name'

    position_id = fields.Many2one(
        comodel_name='cv.position',
        string='Position',
        ondelete='cascade',
        required=True,
    )
    name = fields.Char(
        string='Attribute Name',
        required=True,
        readonly=True,
    )
    attribute_type = fields.Char(
        string='Type',
        readonly=True,
    )
    total_responses = fields.Integer(
        string='Total Responses',
        readonly=True,
    )
    # Aggregated result stored as formatted text for simplicity
    # Could be split into separate fields for min/max/avg but
    # text is more flexible across all attribute types
    aggregation_summary = fields.Text(
        string='Aggregated Result',
        readonly=True,
    )