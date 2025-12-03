// screens/TheatreDetailsScreen.js
import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, StyleSheet
} from "react-native";

const API_BASE = "http://192.168.1.42:3000/api";

export default function TheatreDetailsScreen({ route, navigation }) {
  const { theatreId } = route.params;
  console.log("TheatreDetailsScreen received theatreId:", theatreId);
  const [loading, setLoading] = useState(true);
  const [theatre, setTheatre] = useState(null);
  const [screens, setScreens] = useState([]);
  const [showsByScreen, setShowsByScreen] = useState({});

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/Theatre/${theatreId}/details`);
      const json = await res.json();
      if (json?.status === 200) {
        const d = json.data;
        setTheatre(d.theatre);
        setScreens(d.screens || []);
        setShowsByScreen(d.showsByScreen || {});
      } else {
        console.warn("No details:", json);
      }
    } catch (err) {
      console.error("fetch theatre details", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 30 }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{theatre?.name}</Text>
      <Text style={{ color: "#666", marginTop: 6 }}>{theatre?.address}</Text>

      {screens.length === 0 && <Text style={{ marginTop: 12 }}>No screens found.</Text>}

      {screens.map((screen) => {
          const sid = screen._id.toString();
          const shows = showsByScreen[sid] || [];
          console.log("THe sid for screen ", sid);
          console.log("THe shows for screen ", shows);
        return (
          <View key={sid} style={styles.screenBox}>
            <Text style={styles.screenName}>{screen.name || screen.screenName || `Screen ${screen._id}`}</Text>

            {shows.length === 0 ? (
              <Text style={{ color: "#888", marginTop: 8 }}>No shows for this screen.</Text>
            ) : (
              <View style={{ marginTop: 8 }}>
                {shows.map((show) => {
                  const movie = show.movieId || {};
                  console.log("The movie item is ", movie);
                  return (
                    <TouchableOpacity
                      key={show._id}
                      style={styles.showRow}
                      onPress={() => {
                        // navigate to your existing Shows/Booking flow:
                        // pass the show object so BookingScreen can use it
                        navigation.navigate("Booking", { show, movie });
                      }}
                    >
                      <Image source={{ uri: show.moviePoster }} style={styles.poster} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontWeight: "700" }}>{movie.movieName}</Text>
                        <Text style={{ color: "#666", marginTop: 4 }}>{show.date} • {show.startTime}</Text>
                        <View style={{ flexDirection: "row", marginTop: 6 }}>
                          <View style={styles.timeChip}><Text>{show.startTime}</Text></View>
                          {/* you can show more chips (e.g., language, format) */}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenBox: { marginTop: 16, backgroundColor: "#fafafa", padding: 12, borderRadius: 8 },
  screenName: { fontWeight: "700", fontSize: 16 },
  poster: { width: 70, height: 95, borderRadius: 6 },
  showRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  timeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#eee" },
});
