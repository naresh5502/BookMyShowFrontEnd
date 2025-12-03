// screens/SelectCity.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { setCity } from "../redux/slices/citySlice";
import { useDispatch } from "react-redux";

export default function SelectCity({ navigation }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  async function fetchCities() {
    try {
      const res = await axios.get("http://192.168.1.42:3000/api/City/cities");
      setCities(res.data.data);
    } catch (err) {
      console.log("Error fetching cities: ", err);
    } finally {
      setLoading(false);
    }
  }

  async function selectCity(city) {
    console.log("The city we received is ", city);

    await AsyncStorage.setItem("selectedCity", city.name);
    await AsyncStorage.setItem("selectedCityId", city._id);
    dispatch(setCity(city.name));
    alert("City updated successfully!");
    navigation.replace("MainApp"); // redirect to Home
  }

  useEffect(() => {
    fetchCities();
    console.log("The selectedCityId is ", AsyncStorage.getItem("selectedCityId"));
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF0A54" />
        <Text style={{ marginTop: 10 }}>Loading cities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Select Your City</Text>

      <FlatList
        data={cities}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityBtn}
            onPress={() => selectCity(item)}
          >
            <Text style={styles.cityText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  cityBtn: {
    padding: 15,
    backgroundColor: "#FF0A54",
    marginVertical: 8,
    borderRadius: 10,
  },
  cityText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
