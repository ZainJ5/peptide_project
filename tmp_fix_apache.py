import sys

CONF_PATH = '/etc/apache2/sites-enabled/peptidedosage-le-ssl.conf'

with open(CONF_PATH, 'r') as f:
    conf = f.read()

# Fix: Move "ProxyPass /reconstitution-images !" BEFORE "ProxyPass /"
# Currently it's after the catch-all, which means it never takes effect
old = """    ProxyPass /reconstitution-images !
    ProxyPass / http://127.0.0.1:3000/"""

# Remove the misplaced line
conf = conf.replace('    ProxyPass /reconstitution-images !\n', '')

# Insert it before the catch-all
conf = conf.replace(
    '    ProxyPass / http://127.0.0.1:3000/',
    '    ProxyPass /reconstitution-images !\n    ProxyPass / http://127.0.0.1:3000/'
)

with open(CONF_PATH, 'w') as f:
    f.write(conf)

print('Fixed ProxyPass order.')
