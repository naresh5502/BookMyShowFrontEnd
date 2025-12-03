// screens/SearchTheatreScreen.js
import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

const API_BASE = "http://192.168.1.42:3000/api";

export default function SearchTheatreScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [cityId, setCityId] = useState(null);
  const [cityName, setCityName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Load user's selected city (cityId and cityName)
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("selectedCityId"),
      AsyncStorage.getItem("selectedCityName")
    ]).then(([id, name]) => {
      console.log("Loaded city ID:", id, "City Name:", name);
      setCityId(id);
      setCityName(name);
    });
  }, []);

  const performSearch = async (q, cityId, cityName) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Pass both cityId and cityName as the city parameter
      // The backend will try to match against the city field (string)
      const searchParam = cityName || cityId; // Prefer city name, fallback to cityId
      const url = `${API_BASE}/Shows/unified-search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(searchParam)}`;
      console.log("Calling:", url);

      const res = await fetch(url);
      const json = await res.json();

      const movies = (json.movies || []).map((m) => ({
        _id: `movie-${m._id}`,
        type: "movie",
        movieId: m.movieId,
        movieName: m.movieName,
        moviePoster: m.moviePoster,
        theatreName: m.theatreId?.name,
        date: m.date,
        startTime: m.startTime
      }));

      const theatres = (json.theatres || []).map((t) => ({
        _id: `theatre-${t._id}`,
        type: "theatre",
        name: t.name,
        address: t.address,
        theatreId: t._id
      }));

      setResults([...movies, ...theatres]);
      
    } catch (err) {
      console.log("Search error:", err);
      setResults([]);
    }
    setLoading(false);
  };

  const onSearch = (text) => {
    setQuery(text);
    if (cityId || cityName) performSearch(text, cityId, cityName);
  };

  const renderItem = ({ item }) => {
    if (item.type === "movie") {
      return (
        <TouchableOpacity
          style={styles.movieCard}
          onPress={() => navigation.navigate("MovieDetails", { movie: item })}
        >
          <View style={styles.rowBetween}>
            <Text style={styles.movieName}>{item.movieName}</Text>
            <Ionicons name="film-outline" size={20} color="red" />
          </View>
          <Text style={styles.subInfo}>
            {item.theatreName} • {item.date} • {item.startTime}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("TheatreDetails", { theatreId: item.theatreId })}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>
          <Ionicons name="business-outline" size={20} color="blue" />
        </View>
        <Text style={styles.addr}>{item.address}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.backBtn}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>Search</Text>
      </View>

      <TextInput
        placeholder="Search movies or theatres..."
        value={query}
        onChangeText={onSearch}
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text>No results found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 35 },
  backBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20 },
  header: { fontSize: 20, fontWeight: "700", marginLeft: 12 },
  input: { margin: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10 },
  card: { padding: 14, backgroundColor: "#f5f5f5", borderRadius: 8, marginVertical: 6 },
  movieCard: {
    backgroundColor: "#fff4f4", padding: 14, borderRadius: 8, marginVertical: 6,
    borderLeftWidth: 4, borderLeftColor: "red"
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  movieName: { fontSize: 16, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "700" },
  addr: { color: "#666" },
  subInfo: { marginTop: 4, color: "#555" },
});
