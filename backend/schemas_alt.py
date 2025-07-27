# Alternative schemas without email-validator dependency
# You can use this version if you want to avoid the email-validator package

from pydantic import BaseModel, Field, validator
from typing import Optional, List
import re
from datetime import datetime

# Simple email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

class RestaurantBaseAlt(BaseModel):
    name: str
    cuisine_type: str
    contact_email: str = Field(..., description="Valid email address")
    contact_phone: str

    @validator('contact_email')
    def validate_email(cls, v):
        if not EMAIL_REGEX.match(v):
            raise ValueError('Invalid email address')
        return v

# Note: To use this alternative approach:
# 1. Replace EmailStr with str in schemas.py
# 2. Add the email validator above
# 3. Remove email-validator from requirements.txt
