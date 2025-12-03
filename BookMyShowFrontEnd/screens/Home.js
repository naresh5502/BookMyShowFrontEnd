import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSelector } from "react-redux";
import { useGetMoviesByCityQuery } from "../redux/api/movieApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

useGetMoviesByCityQuery;

// Carousel Ads Data
const CAROUSEL_ADS = [
  {
    id: 1,
    image: "https://via.placeholder.com/400x200/FF6B6B/FFFFFF?text=5%+Cashback",
    title: "5% Cashback",
  },
  {
    id: 2,
    image: "https://via.placeholder.com/400x200/4ECDC4/FFFFFF?text=Rs.500+Off",
    title: "₹500 Off",
  },
  {
    id: 3,
    image: "https://via.placeholder.com/400x200/45B7D1/FFFFFF?text=Free+Tickets",
    title: "Free Tickets",
  },
];

// Category Items with Icons
const CATEGORIES = [
  { id: 1, name: "Comedy", icon: "film" },
  { id: 2, name: "Sci-fi", icon: "sofa" },
  { id: 3, name: "Drama", icon: "music-note" },
  { id: 4, name: "Period", icon: "play-circle" },
  { id: 5, name: "Horror", icon: "happy" },
  { id: 6, name: "Sports", icon: "basketball" },
];

export default function HomeScreen({ navigation }) {
  // Get selected city from Redux store
  // const selectedCity = useSelector((state) => state.city.selectedCity);

  const [selectedCity, setSelectedCity] = useState(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    async function loadCity() {
      const city = await AsyncStorage.getItem("selectedCity");
      const cityId = await AsyncStorage.getItem("selectedCityId");
      console.log("City loaded:", city);
      console.log("CityId loaded:", cityId);
      setSelectedCity(city);
    }
    loadCity();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % CAROUSEL_ADS.length);
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll to current ad index
  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollToIndex({
        index: currentAdIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentAdIndex]);

  useEffect(() => {
    console.log("selectedCity UPDATED:", selectedCity);
  }, [selectedCity]);

  const { data: movies, isLoading, isFetching, error } = useGetMoviesByCityQuery(selectedCity, {
    skip: !selectedCity,
  });

  // Filter out movies with missing poster or name
  const validMovies = movies?.filter(
    (movie) => movie.moviePoster && movie.movieName
  ) || [];
  // } = useGetMoviesByCityQuery(selectedCity, {
  //   skip: !selectedCity, // avoid API call if city not selected
  // });

  console.log("The movies we received from the backend ", movies);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}r
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>It All Starts Here!</Text>

          <TouchableOpacity onPress={() => navigation.navigate("SelectCity")}>
            <Text style={styles.cityText}>
              {selectedCity || "Select City"} ▾
            </Text>
          </TouchableOpacity>
                  <TouchableOpacity
    style={styles.searchButton}
    onPress={() => navigation.navigate("SearchTheatre")}
  >
    <Ionicons name="search" size={24} color="black" />
  </TouchableOpacity>
        </View>



        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {CATEGORIES.map((item) => (
            <TouchableOpacity key={item.id} style={styles.categoryItem}>
              <View style={styles.categoryIcon}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={24}
                  color="#ff2e63"
                />
              </View>
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Carousel Ads Banner */}
        <View style={styles.carouselWrapper}>
          <FlatList
            ref={carouselRef}
            data={CAROUSEL_ADS}
            keyExtractor={(item) => String(item.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const contentOffsetX = event.nativeEvent.contentOffset.x;
              const index = Math.round(contentOffsetX / width);
              setCurrentAdIndex(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.adBanner, { width: width - 24 }]}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.bannerImage}
                />
                <View style={styles.adOverlay}>
                  <Text style={styles.adText}>{item.title}</Text>
                  <TouchableOpacity style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>Apply Now</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
          {/* Carousel Indicators */}
          <View style={styles.indicatorContainer}>
            {CAROUSEL_ADS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentAdIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Old Banner - Promotional Banner */}
        <View style={styles.bannerWrapper}>
          <Image
            source={{ uri: "https://via.placeholder.com/400x150/FFB800/000000?text=Unlock+%E2%82%B9500+Off" }}
            style={styles.promotionalBanner}
          />
        </View>

        {/* Recommended Movies Section */}
        <View style={styles.recommendHeader}>
          <Text style={styles.recommendTitle}>Recommended Movies</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All ›</Text>
          </TouchableOpacity>
        </View>

        {/* === Loading State === */}
        {(isLoading ) && (
          <ActivityIndicator
            size="large"
            color="red"
            style={{ marginTop: 20 }}
          />
        )}

        {/* === Error State === */}
        {error && (
          <Text style={{ color: "red", marginLeft: 16, marginTop: 10 }}>
            Failed to load movies
          </Text>
        )}

        {/* === Movie List === */}
        <View style={styles.recommendList}>
          <FlatList
            data={validMovies}
            keyExtractor={(item) => String(item.movieId)}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={styles.columnWrapper}
            renderItem={({ item: movie }) => (
              <TouchableOpacity
                style={styles.movieCard}
                onPress={() => navigation.navigate("MovieDetails", { movie })}
              >
                <Image
                  source={{
                    uri:
                      movie.moviePoster || "https://via.placeholder.com/120x180",
                  }}
                  style={styles.movieImage}
                />
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {movie.movieName}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchButton: {
    padding: 6,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
  },

  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  cityText: {
    color: "red",
    fontWeight: "600",
    marginTop: 4,
  },
  categoriesContainer: {
    marginTop: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 20,
  },
  categoryIcon: {
    width: 54,
    height: 54,
    backgroundColor: "#f5f5f5",
    borderRadius: 27,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },

  // Carousel Styles
  carouselWrapper: {
    marginTop: 16,
    marginBottom: 12,
  },
  adBanner: {
    marginHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  bannerImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
  },
  promotionalBanner: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  adOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  adText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  applyButton: {
    backgroundColor: "#ff2e63",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#ff2e63",
    width: 24,
  },

  bannerWrapper: {
    marginTop: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  recommendHeader: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  seeAll: {
    color: "red",
    fontSize: 14,
  },
  recommendList: {
    marginTop: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
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
});
