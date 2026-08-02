{
    'name': 'CV Runner Integration',
    'version': '1.0',
    'summary': 'Import position data from CV Runner via API token',
    'category': 'Human Resources',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/cv_position_views.xml',
        'views/import_wizard_views.xml',
        'views/export_wizard_views.xml',
    ],
    'installable': True,
    'application': True,
}