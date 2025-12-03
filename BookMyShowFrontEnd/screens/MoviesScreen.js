import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetMoviesByCityQuery } from "../redux/api/movieApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function MoviesScreen({ navigation }) {
  const [selectedCity, setSelectedCity] = useState(null);

  // Load selected city from AsyncStorage
  useEffect(() => {
    async function loadCity() {
      const city = await AsyncStorage.getItem("selectedCity");
      setSelectedCity(city);
    }
    loadCity();
  }, []);

  // Fetch movies
  const { data: movies, isLoading, error } = useGetMoviesByCityQuery(
    selectedCity,
    { skip: !selectedCity }
  );

  // Filter out movies with missing poster or name
  const validMovies = movies?.filter(
    (movie) => movie.moviePoster && movie.movieName
  ) || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>All Movies</Text>

        <TouchableOpacity onPress={() => navigation.navigate("SelectCity")}>
          <Text style={styles.cityText}>{selectedCity || "Select City"} ▾</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={22} color="black" />
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT AREA MUST HAVE FLEX: 1 */}
      <View style={{ flex: 1 }}>
        {/* Loading */}
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#ff2e63" />
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load movies</Text>
          </View>
        )}

        {/* Empty */}
        {!isLoading && !error && validMovies.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              No movies available in {selectedCity}
            </Text>
          </View>
        )}

        {/* Movie Grid */}
        {!isLoading && !error && validMovies.length > 0 && (
          <FlatList
            data={validMovies}
            keyExtractor={(item) => String(item.movieId)}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: movie }) => (
              <TouchableOpacity
                style={styles.movieCard}
                onPress={() =>
                  navigation.navigate("MovieDetails", { movie })
                }
              >
                <Image
                  source={{
                    uri:
                      movie.moviePoster ||
                      "https://via.placeholder.com/150x220",
                  }}
                  style={styles.movieImage}
                />
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movie.movieName}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },

  cityText: {
    color: "#ff2e63",
    fontWeight: "600",
    fontSize: 15,
  },

  searchButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    marginLeft: 10,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 20,
  },

  movieCard: {
    width: "48%",
    alignItems: "center",
  },

  movieImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 12,
    backgroundColor: "#ddd",
  },

  movieTitle: {
    marginTop: 8,
    width: "100%",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ff2e63",
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
  },
});
