"""
Helper module for handling enum conversions between SQLAlchemy and Pydantic
"""
from typing import Any, Type, TypeVar, Dict, Union
from enum import Enum

T = TypeVar('T', bound=Enum)

def convert_enum_value_to_enum_member(value: Any, enum_class: type) -> Any:
    """
    Convert a string value to the corresponding enum member.
    This resolves the mismatch between string values in API and enum members in SQLAlchemy.
    
    Args:
        value: The string value (e.g., "Cleaning", "monday") or enum object
        enum_class: The enum class (e.g., TaskCategory, Day)
        
    Returns:
        The corresponding enum member
    
    Raises:
        ValueError: If the value doesn't match any enum member
    """
    print(f"Converting value '{value}' (type: {type(value)}) to enum {enum_class.__name__}")
    
    # If it's already an enum member of the correct type, return it
    if isinstance(value, enum_class):
        print(f"  Already correct enum type: {value}")
        return value
    
    # Convert to string for processing
    value_str = str(value)
    
    # Handle string representations like "TaskStatus.SUBMITTED" -> "SUBMITTED"
    if "." in value_str and value_str.startswith(enum_class.__name__):
        value_str = value_str.split(".")[-1]
        print(f"  Extracted enum name: {value_str}")
    
    # Try to match by value first (this is what we usually want)
    for member in enum_class:
        print(f"  Checking member {member.name} with value '{member.value}'")
        if member.value == value_str:
            print(f"  Found match by value: {member}")
            return member
    
    print(f"  No value match found for '{value_str}'")
    
    # If no value match, try direct match with enum member name
    try:
        result = enum_class[value_str]
        print(f"  Found by name: {result}")
        return result
    except KeyError:
        pass
            
    # If we get here, no match was found
    valid_values = [f"{member.name} ({member.value})" for member in enum_class]
    raise ValueError(f"Invalid value '{value}' for enum {enum_class.__name__}. Valid values: {', '.join(valid_values)}")

def convert_enum_for_api(obj: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively convert Enum instances in an object to their string values
    for API responses.
    
    Args:
        obj: The object to convert
        
    Returns:
        The object with enum members converted to their string values
    """
    if isinstance(obj, dict):
        return {key: convert_enum_for_api(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_enum_for_api(item) for item in obj]
    elif isinstance(obj, Enum):
        return obj.value
    else:
        return obj
