import React from 'react'
import SocialLogin from 'react-social-login'
import Button from 'react-bootstrap/Button';

const ChildButton = ({ children, triggerLogin, size, variant, disabled}) => (
  <Button onClick={triggerLogin} size={size} variant={variant} block disabled={disabled}>
    { children }
  </Button>
)
 
export default SocialLogin(ChildButton)