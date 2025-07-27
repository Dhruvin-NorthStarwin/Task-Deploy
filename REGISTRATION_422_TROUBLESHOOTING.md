# 🔍 Troubleshooting Guide: 422 Error on /auth/register

## ❌ Problem Description
You're encountering a **422 Unprocessable Entity** error when trying to register a new restaurant through the `/auth/register` endpoint.

## ✅ Fixes Applied

### 1. **Improved Error Handling**
- ✅ Added a dedicated `register` function in `apiService.ts`
- ✅ Enhanced error messages with specific 422 handling
- ✅ Added debug logging for registration requests
- ✅ Better error reporting to show actual validation issues

### 2. **Request Data Validation**
The registration request requires these exact fields:
```json
{
  "name": "Restaurant Name",
  "cuisine_type": "Cuisine Type", 
  "contact_email": "valid@email.com",
  "contact_phone": "1234567890",
  "password": "password",
  "locations": [
    {
      "address_line1": "123 Main St",
      "town_city": "City Name", 
      "postcode": "12345"
    }
  ]
}
```

## 🔍 Common Causes of 422 Errors

### 1. **Email Validation Issues**
- Invalid email format
- Missing `@` symbol or domain
- Special characters that aren't allowed

### 2. **Missing Required Fields**
- Empty `name`, `contact_email`, `password`
- Missing or empty `locations` array
- Missing location fields (`address_line1`, `town_city`, `postcode`)

### 3. **Data Type Mismatches**
- `locations` not being an array
- String fields being sent as null/undefined

### 4. **Backend Validation Rules**
- Password minimum length requirements
- Email already registered
- Invalid postcode format

## 🛠️ How to Debug

### 1. **Enable Debug Mode**
In your `.env` file, set:
```bash
VITE_DEBUG=true
```

### 2. **Check Browser Console**
The improved error handling will now show:
- ✅ Exact request data being sent
- ✅ Detailed error responses from server
- ✅ Specific validation failure messages

### 3. **Check Network Tab**
In browser DevTools > Network:
1. Look for the `/auth/register` request
2. Check the **Request Headers**
3. Check the **Request Payload** 
4. Check the **Response** for detailed error message

### 4. **Test with Sample Data**
Use this working test data:
```javascript
const testData = {
  name: "Test Restaurant",
  cuisine_type: "Italian",
  contact_email: "test@example.com", 
  contact_phone: "1234567890",
  password: "testpassword123",
  locations: [
    {
      address_line1: "123 Test Street",
      town_city: "Test City",
      postcode: "12345"
    }
  ]
};
```

## 🔧 Quick Fixes to Try

### 1. **Validate Email Format**
Ensure the email follows standard format: `user@domain.com`

### 2. **Check Required Fields**
Make sure all form fields are filled before submitting

### 3. **Clear Browser Cache**
Sometimes cached requests can cause issues

### 4. **Try Different Email**
The email might already be registered

## 📊 Error Messages You Might See

- **"Email already registered"** → Try a different email
- **"Please check all fields are filled correctly"** → 422 validation error
- **"Server error. Please try again later"** → Network/server issue

## ✅ Latest Updates

The registration system now includes:
- ✅ Better error reporting
- ✅ Detailed debug logging
- ✅ Proper validation feedback
- ✅ Consistent API service usage

## 🚀 Next Steps

1. **Try registering again** with the improved error handling
2. **Check the browser console** for detailed error messages
3. **Verify all form fields** are properly filled
4. **Contact support** if the issue persists with specific error details

The registration should now provide much clearer error messages to help identify exactly what's causing the 422 error!
