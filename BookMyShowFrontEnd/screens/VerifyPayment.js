import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { useDispatch } from "react-redux";
import { clearSelectedSeats } from "../redux/slices/showSeatSlice";

import { useVerifyPaymentMutation } from "../redux/api/paymentApi";
import { showSeatApi } from "../redux/api/showSeatApi"; // ✅ Import for refetch

export default function VerifyPayment({ route, navigation }) {
  const { bookingId, paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, showId } =
    route.params;

  const [verifyPayment] = useVerifyPaymentMutation();
  const dispatch = useDispatch();

  const [status, setStatus] = useState("VERIFYING"); // VERIFYING | SUCCESS | FAILED
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  // RUN PAYMENT VERIFICATION
  useEffect(() => {
    verifyNow();
  }, []);

  async function verifyNow() {
    try {
      await verifyPayment({
        bookingId,
        paymentDbId: paymentId,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }).unwrap();

      setStatus("SUCCESS");
      animate();
    } catch (err) {
      setStatus("FAILED");
      animate();
    }
  }

  const animate = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (status === "SUCCESS") {
      dispatch(clearSelectedSeats());  // ✔ SAFE here

      async function fetchBookingAndNavigate() {
        try {
          // ✅ REFETCH SEATS DATA AFTER PAYMENT SUCCESS
          if (showId) {
            dispatch(showSeatApi.util.invalidateTags([{ type: "ShowSeats", id: showId }]));
          }

          const response = await fetch(`http://192.168.1.42:3000/api/Booking/booking/${bookingId}`);
          console.log("Data fetched for booking navigation:", response);
          const booking = await response.json();
          const timer = setTimeout(() => navigation.replace("TicketScreen", { booking: booking.data }), 1800);
          return () => clearTimeout(timer);
        } catch (error) {
          console.error("Failed to fetch booking:", error);
        }
      }
      fetchBookingAndNavigate();  
    }
  }, [status]);

  return (
    <View style={styles.container}>
      {/* LOADING */}
      {status === "VERIFYING" && (
        <>
          <ActivityIndicator size="large" color="#ff2e63" />
          <Text style={styles.loadingText}>Finalizing your payment…</Text>
          <Text style={styles.smallInfo}>Please wait while we verify the transaction</Text>
        </>
      )}

      {/* SUCCESS UI */}
      {status === "SUCCESS" && (
        <Animated.View style={[styles.resultBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✔</Text>
          </View>
          <Text style={styles.title}>Payment Successful</Text>
          <Text style={styles.subtitle}>Your booking is confirmed 🎉</Text>
          <Text style={styles.redirect}>Redirecting to home…</Text>
        </Animated.View>
      )}

      {/* FAILED UI */}
      {status === "FAILED" && (
        <Animated.View style={[styles.resultBox, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.failCircle}>
            <Text style={styles.failIcon}>✖</Text>
          </View>
          <Text style={styles.failTitle}>Session Timeout</Text>
          <Text style={styles.subtitle}>Your seats were automatically released.</Text>

          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              dispatch(clearSelectedSeats());
              navigation.navigate("MainApp");
            }}
          >
            <Text style={styles.retryText}>Go To Home</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ------------------------ STYLES ------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
    backgroundColor: "#fdfdfd",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },

  smallInfo: {
    color: "#888",
    marginTop: 8,
    fontSize: 13,
  },

  resultBox: {
    alignItems: "center",
    paddingHorizontal: 16,
  },

  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: "#d5f8df",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22bb33",
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  successIcon: {
    fontSize: 62,
    color: "#22bb33",
    fontWeight: "900",
  },

  failCircle: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: "#ffe1e1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff4444",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  failIcon: {
    fontSize: 62,
    color: "#ff4444",
    fontWeight: "900",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 14,
    color: "#222",
  },

  failTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 14,
    color: "#ff4444",
  },

  subtitle: {
    marginTop: 8,
    color: "#555",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 10,
    lineHeight: 22,
  },

  redirect: {
    marginTop: 18,
    color: "#999",
    fontStyle: "italic",
  },

  refundInfo: {
    marginTop: 16,
    color: "#777",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 10,
  },

  retryBtn: {
    marginTop: 22,
    backgroundColor: "#ff2e63",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#ff2e63",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  retryText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  homeBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  homeText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
});
