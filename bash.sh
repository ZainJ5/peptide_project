#!/bin/bash

sudo chown -R "devopsuser":"devopsuser" "/home/devopsuser"

#Creating the SSH directory
sudo mkdir -p "/home/devopsuser/.ssh"
#Making user the owner
sudo chown "devopsuser":"devopsuser" "/home/devopsuser/.ssh"
#Changing file permissions
sudo chmod 700 /home/devopsuser/.ssh

sudo -u "devopsuser" ssh-keygen -t rsa -b 2048 -f "/home/devopsuser/.ssh/id_rsa" -N ""
echo "SSH key generated"

# Disable password authentication
sudo sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Restart SSH service to apply changes
sudo systemctl restart ssh

echo "Password authentication disabled"

#Passwordless Login
AUTHORIZED_KEYS="/home/devopsuser/.ssh/authorized_keys"
sudo -u "devopsuser" touch "$AUTHORIZED_KEYS"
# Add the  SSH in authorized_key file
sudo -u "devopsuser" cat "/home/devopsuser/.ssh/id_rsa.pub" >> "$AUTHORIZED_KEYS"
sudo chown "devopsuser":"devopsuser" "$AUTHORIZED_KEYS"
sudo chmod 600 "$AUTHORIZED_KEYS"
echo "Public key added to authorized_keys."

# SSH config file
cat << 'EOF' | sudo -u "devopsuser" tee /home/devopsuser/.ssh/config > /dev/null
Host without_ip
    HostName localhost
    User devopsuser
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
EOF
sudo chmod 600 /home/devopsuser/.ssh/config

#Non-intractive Task
# Updated to use the alias created above
sudo -u "devopsuser" ssh without_ip << 'EOF'
mkdir -p ~/test_directory
echo "I am doing the task3." > ~/test_directory/filecreatedinnoninteractivemode.txt
EOF

echo "SSH tasks completed (non-intractive)"