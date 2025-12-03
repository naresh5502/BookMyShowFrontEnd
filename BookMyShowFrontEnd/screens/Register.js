import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from "react-native";

const API_BASE = "http://192.168.1.42:3000/api";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Validation patterns
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,6}$/;
  const PHONE_REGEX = /^[6-9]\d{9}$/;
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  // Error states
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Real-time validation function
  const validateField = (fieldName, value) => {
    let error = "";

    switch (fieldName) {
      case "name":
        if (!value) error = "Name is required";
        else if (value.length < 2) error = "Name must be at least 2 characters";
        else if (!/^[a-zA-Z\s]+$/.test(value)) error = "Name can only contain letters";
        break;

      case "email":
        if (!value) error = "Email is required";
        else if (!EMAIL_REGEX.test(value)) error = "Invalid email format (use: name@domain.com)";
        break;

      case "phone":
        if (!value) error = "Phone number is required";
        else if (!PHONE_REGEX.test(value)) error = "Phone must start with 6-9 and have 10 digits";
        break;

      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Password must be at least 8 characters";
        else if (!/[a-z]/.test(value)) error = "Password must include lowercase letter";
        else if (!/[A-Z]/.test(value)) error = "Password must include uppercase letter";
        else if (!/\d/.test(value)) error = "Password must include a number";
        else if (!/[\W_]/.test(value)) error = "Password must include special character";
        break;

      case "confirmPassword":
        if (!value) error = "Confirm password is required";
        else if (value !== password) error = "Passwords do not match";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }));
    return error === "";
  };

  const handleFieldChange = (fieldName, value) => {
    switch (fieldName) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "phone":
        setPhone(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      default:
        break;
    }
    // Validate on change
    validateField(fieldName, value);
  };

  const validateAll = () => {
    const nameValid = validateField("name", name);
    const emailValid = validateField("email", email);
    const phoneValid = validateField("phone", phone);
    const passwordValid = validateField("password", password);
    const confirmPasswordValid = validateField("confirmPassword", confirmPassword);

    return nameValid && emailValid && phoneValid && passwordValid && confirmPasswordValid;
  };

  const handleRegister = async () => {
    if (!validateAll()) {
      Alert.alert("Validation Error", "Please fix all errors before registering");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/Auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          Password: password,
        }),
      });

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.log("Non-JSON response:", text.substring(0, 200));
        throw new Error(`Server error: ${response.status}`);
      }

      if (response.status === 200 || (data && data.status === 200)) {
        Alert.alert("Success", "Account created successfully");
        navigation.replace("Login");
      } else {
        const msg = data?.message || "Registration failed";
        Alert.alert("Error", msg);
        console.log("Registration failed:", data);
      }
    } catch (error) {
      console.log("Register error:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Your Account</Text>

      {/* Name Field */}
      <View style={styles.fieldWrapper}>
        <TextInput
          placeholder="Full Name"
          style={[styles.input, errors.name && styles.inputError]}
          value={name}
          onChangeText={(value) => handleFieldChange("name", value)}
          editable={!loading}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Email Field */}
      <View style={styles.fieldWrapper}>
        <TextInput
          placeholder="Email"
          style={[styles.input, errors.email && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(value) => handleFieldChange("email", value)}
          editable={!loading}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* Phone Field */}
      <View style={styles.fieldWrapper}>
        <TextInput
          placeholder="Phone Number"
          style={[styles.input, errors.phone && styles.inputError]}
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={(value) => handleFieldChange("phone", value)}
          editable={!loading}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Password Field */}
      <View style={styles.fieldWrapper}>
        <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
          <TextInput
            placeholder="Password"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(value) => handleFieldChange("password", value)}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Text>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        <Text style={styles.passwordHint}>Min 8 chars, uppercase, lowercase, number, special char</Text>
      </View>

      {/* Confirm Password Field */}
      <View style={styles.fieldWrapper}>
        <View style={[styles.passwordContainer, errors.confirmPassword && styles.inputError]}>
          <TextInput
            placeholder="Confirm Password"
            style={styles.passwordInput}
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={(value) => handleFieldChange("confirmPassword", value)}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Text>{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.6 }]} 
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}


// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#111",
  },

  fieldWrapper: {
    marginVertical: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },

  inputError: {
    borderColor: "#ff2e63",
    borderWidth: 2,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
  },

  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },

  eyeIcon: {
    padding: 8,
  },

  errorText: {
    color: "#ff2e63",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },

  passwordHint: {
    color: "#999",
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },

  button: {
    backgroundColor: "#ff2e55",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  loginText: {
    marginTop: 15,
    textAlign: "center",
    color: "#444",
    fontSize: 13,
  },
});
