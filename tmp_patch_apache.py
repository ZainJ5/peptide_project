import sys

CONF_PATH = '/etc/apache2/sites-enabled/peptidedosage-le-ssl.conf'

with open(CONF_PATH, 'r') as f:
    conf = f.read()

# Update directory paths from /root/... to /var/www/...
OLD_DIR = '/root/peptide_project/frontend/public/images/reconstitution'
NEW_DIR = '/var/www/reconstitution-images'

conf = conf.replace(OLD_DIR, NEW_DIR)

with open(CONF_PATH, 'w') as f:
    f.write(conf)

print('Apache config updated - paths fixed.')
