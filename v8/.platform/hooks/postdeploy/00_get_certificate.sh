#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d oysterfarminsurrance.us-east-1.elasticbeanstalk.com --nginx --agree-tos --email bgurr13@byu.edu
sudo certbot -n -d oysterquoter.is404.net --nginx --agree-tos --email bgurr13@byu.edu