import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
// import { AsyncStorage } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Ionicons } from "@expo/vector-icons";
import { useGetShowsByMovieQuery, useGetShowsByMovieCityDateQuery } from "../redux/api/showApi";

const BASE_API = "http://192.168.1.42:3000/api"; 

export default function ShowsScreen({ route, navigation }) {
  const { movieId, movie, city: cityFromParams } = route.params || {};
  
  console.log("ShowsScreen - route.params:", route.params);
  console.log("ShowsScreen - movieId:", movieId);
  console.log("ShowsScreen - cityFromParams:", cityFromParams);
  console.log("ShowsScreen - movie:", movie);
  console.log("ShowsScreen - movieTitle:", movieTitle);
  // Extract only serializable data from movie
  const movieTitle = movie?.movieName || movie?.title || "Movies";
  
  const [city, setCity] = useState(cityFromParams || null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [filteredShows, setFilteredShows] = useState([]);
  const [theatreNames, setTheatreNames] = useState({}); // Store fetched theatre names

  // Load city from AsyncStorage if not provided in params
  useEffect(() => {
    async function loadCity() {
      try {
        if (!cityFromParams) {
          const storedCity = await AsyncStorage.getItem("selectedCity");
          if (storedCity) {
            setCity(storedCity);
            console.log("City loaded from AsyncStorage:", storedCity);
          }
        } else {
          setCity(cityFromParams);
          console.log("City from params:", cityFromParams);
        }
      } catch (error) {
        console.log("Error loading city from AsyncStorage:", error);
      }
    }
    loadCity();
  }, [cityFromParams]);

  // Fetch shows using RTK Query with city and date
  const {
    data: showsData,
    isLoading,
    isError,
    error,
  } = useGetShowsByMovieCityDateQuery(
    { movieId: movieId ? String(movieId) : "", city: city || "", date: selectedDate || "" },
    { skip: !movieId || !city || !selectedDate }
  );

  console.log("ShowsScreen - movieId:", movieId);
  console.log("ShowsScreen - city:", city);
  console.log("ShowsScreen - selectedDate:", selectedDate);
  console.log("ShowsScreen - shows data:", showsData);
  console.log("ShowsScreen - isError:", isError);
  console.log("ShowsScreen - error:", error);

  // Generate next 7 days for date selector
  const generateNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      let d = new Date(today);
      d.setDate(d.getDate() + i);

      days.push({
        full: d.toISOString().split("T")[0],
        dayName: d.toLocaleString("en-US", { weekday: "short" }),
        dateNum: d.getDate(),
      });
    }
    return days;
  };

  const dates = generateNext7Days();

  // Initialize with today's date on first load
  useEffect(() => {
    if (!selectedDate && dates.length > 0) {
      setSelectedDate(dates[0].full);
    }
  }, []);

  // Update filtered shows when RTK Query returns data
  useEffect(() => {
    if (isError || !showsData) {
      // Clear data on error or when no data is returned
      console.log("Clearing shows due to error or no data");
      setFilteredShows([]);
      return;
    }

    // Backend returns { message, data: [...] }
    const list = Array.isArray(showsData) ? showsData : (showsData?.data || []);
    console.log("Filtered shows list:", list);
    setFilteredShows(list);
  }, [showsData, isError]);

  // Fetch theatre names from API for all theatre IDs in shows
  useEffect(() => {
    if (!Array.isArray(filteredShows) || filteredShows.length === 0) return;

    const fetchTheatreNames = async () => {
      const uniqueTheatreIds = [...new Set(filteredShows.map(show => show.theatreId))];
      
      const newTheatreNames = { ...theatreNames };
      
      for (const theatreId of uniqueTheatreIds) {
        // Skip if already fetched
        if (newTheatreNames[theatreId]) continue;

        try {
          const response = await fetch(
            `${BASE_API}/Theatre/Theatres/id/${theatreId}`
          );
          
          if (response.ok) {
            const data = await response.json();
            newTheatreNames[theatreId] = data.name || data.theatreName || theatreId;
            console.log(`Fetched theatre name for ${theatreId}:`, newTheatreNames[theatreId]);
          } else {
            // If API fails, use theatreId as fallback
            newTheatreNames[theatreId] = theatreId;
          }
        } catch (error) {
          console.log(`Error fetching theatre ${theatreId}:`, error);
          newTheatreNames[theatreId] = theatreId;
        }
      }
      
      setTheatreNames(newTheatreNames);
    };

    fetchTheatreNames();
  }, [filteredShows]);

  // Group shows by theatre first, then by movie within theatre
  // const showsByTheatreAndMovie = useMemo(() => {
  //   if (!Array.isArray(filteredShows)) return {};
    
  //   const grouped = {};
  //   filteredShows.forEach((show) => {
  //     const theatreId = show.theatreId ? String(show.theatreId) : "unknown";
  //     const movieTitle = show.movieName || "Unknown Movie";

  //     if (!grouped[theatreId]) {
  //       grouped[theatreId] = {
  //         theatre: show.theatre || { name: theatreId },
  //         movieGroups: {},
  //       };
  //     }

  //     if (!grouped[theatreId].movieGroups[movieTitle]) {
  //       grouped[theatreId].movieGroups[movieTitle] = {
  //         format: show.format || "2D",
  //         language: show.language || "English",
  //         shows: [],
  //       };
  //     }

  //     grouped[theatreId].movieGroups[movieTitle].shows.push(show);
  //   });

  //   return grouped;
  // }, [filteredShows]);

  const showsByTheatreAndMovie = useMemo(() => {
  if (!Array.isArray(filteredShows)) return {};

  const grouped = {};

  filteredShows.forEach((show) => {
    const theatreId = show.theatreId ? String(show.theatreId) : "unknown";
    const movieTitle = show.movieName || "Unknown Movie";

    if (!grouped[theatreId]) {
      grouped[theatreId] = {
        theatre: show.theatre || { name: theatreId },
        movieGroups: {},
      };
    }

    if (!grouped[theatreId].movieGroups[movieTitle]) {
      grouped[theatreId].movieGroups[movieTitle] = {
        format: show.format || "2D",
        language: show.movieLanguage || "English",
        shows: [],
      };
    }

    grouped[theatreId].movieGroups[movieTitle].shows.push(show);
  });

  return grouped;
}, [filteredShows]);


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff2e63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* THEATRE LOCATION HEADER */}
      <View style={styles.locationHeader}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>
            {movieTitle}
          </Text>
          <Text style={styles.locationSubtitle}>{city || "Select City"}</Text>
        </View>
        <TouchableOpacity style={styles.detailsBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* DATE SELECTOR - VERTICAL */}
      <View style={styles.dateRowVertical}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
        >
          {dates.map((d) => (
            <TouchableOpacity
              key={d.full}
              onPress={() => setSelectedDate(d.full)}
              style={[
                styles.datePillVertical,
                selectedDate === d.full && styles.datePillVerticalActive,
              ]}
            >
              <Text 
                style={[
                  styles.dayNameVertical,
                  selectedDate === d.full && styles.dayNameActiveVertical,
                ]}
              >
                {d.dayName}
              </Text>
              <Text 
                style={[
                  styles.dateNumVertical,
                  selectedDate === d.full && styles.dateNumActiveVertical,
                ]}
              >
                {d.dateNum}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingFilter && (
        <ActivityIndicator style={styles.loaderStyle} color="#ff2e63" size="small" />
      )}

      {/* SHOWS LIST */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.keys(showsByTheatreAndMovie).length === 0 && !loadingFilter && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No shows available.</Text>
          </View>
        )}

        {Object.entries(showsByTheatreAndMovie).map(([theatreId, theatreGroup]) => (
          <View key={theatreId} style={styles.theatreBlock}>
            {/* THEATRE HEADER */}
            <View style={styles.theatreHeader}>
              <View style={styles.theatreInfo}>
                <Text style={styles.theatreName}>
                  {theatreNames[theatreId] || theatreId}
                </Text>
                <Text style={styles.theatreLocation}>
                  {theatreGroup.theatre?.location || ""}
                </Text>
              </View>
              <TouchableOpacity style={styles.infoBtn}>
                <Ionicons name="information-circle-outline" size={24} color="#ff2e63" />
              </TouchableOpacity>
            </View>

            {/* MOVIES IN THIS THEATRE */}
            {Object.entries(theatreGroup.movieGroups).map(([movieTitle, movieData]) => (
              <View key={movieTitle} style={styles.movieRow}>
                {/* MOVIE TITLE + FORMAT */}
                <View style={styles.movieHeader}>
                  <Text style={styles.movieTitle}>{movieTitle}</Text>
                  <View style={styles.formatBadges}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{movieData.format || "2D"}</Text>
                    </View>
                    <View style={[styles.badge, styles.languageBadge]}>
                      <Text style={styles.badgeText}>
                        {(movieData.language || "English").slice(0, 3).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* SHOW TIMES */}
                <View style={styles.showTimesContainer}>
                  {movieData.shows.map((show) => (
                    <TouchableOpacity
                      key={show._id}
                      style={[
                        styles.timeButton,
                        getTimeButtonStyle(show.format),
                      ]}
                      onPress={() =>
                        navigation.navigate("Booking", {
                          show: show,
                          movie: { 
                            movieId: movieId,
                            title: movieTitle 
                          },
                          startTime: show.startTime,
                        })
                      }
                    >
                      <Text 
                        style={[
                          styles.timeButtonText,
                          getTimeTextStyle(show.format),
                        ]}
                      >
                        {formatShowTime(show.startTime)}
                      </Text>
                      {show.format === "dubbed" && (
                        <Text style={styles.timeButtonBadge}>ENG</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Helper function to format time
function formatShowTime(time) {
  if (!time) return "TBA";
  if (time.includes(":")) return time;
  return time;
}

// Helper function to get button style based on format
function getTimeButtonStyle(format) {
  if (format === "dubbed" || format === "ENG") {
    return { borderColor: "#FFA500", backgroundColor: "#FFF8F0" };
  }
  if (format === "ATMOS" || format === "atmos") {
    return { borderColor: "#4CAF50", backgroundColor: "#F0F8F0" };
  }
  return { borderColor: "#E0E0E0", backgroundColor: "#FFFFFF" };
}

// Helper function to get text style based on format
function getTimeTextStyle(format) {
  if (format === "dubbed" || format === "ENG") {
    return { color: "#FFA500" };
  }
  if (format === "ATMOS" || format === "atmos") {
    return { color: "#4CAF50" };
  }
  return { color: "#333333" };
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  // Location Header
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  locationSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  detailsBtn: {
    padding: 8,
  },
  
  
  // Date Selector - Vertical Layout
  dateRowVertical: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  datePillVertical: {
    width: 70,
    height: 110,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    borderWidth: 0,
  },
  datePillVerticalActive: {
    backgroundColor: "#ff2e63",
    width: 70,
    height: 110,
  },
  dayNameVertical: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  dayNameActiveVertical: {
    color: "#fff",
    fontWeight: "600",
  },
  dateNumVertical: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 4,
  },
  dateNumActiveVertical: {
    color: "#fff",
  },
  
  loaderStyle: {
    marginVertical: 10,
  },

  // Scroll Content
  scroll: { 
    flex: 1,
    paddingHorizontal: 12,
  },
  scrollContent: { 
    paddingTop: 8,
    paddingBottom: 36,
  },
  
  emptyRow: { 
    padding: 40, 
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },

  // Theatre Block
  theatreBlock: {
    marginBottom: 16,
    backgroundColor: "#fafafa",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  theatreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  theatreInfo: {
    flex: 1,
  },
  theatreName: { 
    fontSize: 15, 
    fontWeight: "700",
    color: "#111",
  },
  theatreLocation: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  infoBtn: {
    padding: 6,
  },

  // Movie Row
  movieRow: {
    marginBottom: 12,
  },
  movieHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  formatBadges: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
  },
  languageBadge: {
    backgroundColor: "#f0f0f0",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#555",
  },

  // Show Times
  showTimesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  timeButtonBadge: {
    fontSize: 8,
    fontWeight: "700",
    color: "#FFA500",
    marginTop: 2,
  },
});
