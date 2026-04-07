# Fix SSL config
with open('/etc/apache2/sites-available/peptidedosage-le-ssl.conf', 'r') as f:
    conf = f.read()

conf = conf.replace('# Canonical redirect: non-www -> www', '# Canonical redirect: www -> non-www')
conf = conf.replace('RewriteCond %{HTTP_HOST} ^mypeptidedosages', 'RewriteCond %{HTTP_HOST} ^www.mypeptidedosages')
conf = conf.replace('https://www.mypeptidedosages.com', 'https://mypeptidedosages.com')

with open('/etc/apache2/sites-available/peptidedosage-le-ssl.conf', 'w') as f:
    f.write(conf)

# Fix HTTP config
with open('/etc/apache2/sites-available/peptidedosage.conf', 'r') as f:
    conf = f.read()

conf = conf.replace('# Redirect all HTTP traffic to HTTPS canonical (www)', '# Redirect all HTTP traffic to HTTPS canonical (non-www)')
conf = conf.replace('https://www.mypeptidedosages.com', 'https://mypeptidedosages.com')

with open('/etc/apache2/sites-available/peptidedosage.conf', 'w') as f:
    f.write(conf)

print('Both configs updated successfully')
