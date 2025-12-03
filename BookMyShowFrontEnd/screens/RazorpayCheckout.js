// RazorpayCheckoutScreen.js

import React from "react";
import { WebView } from "react-native-webview";

export default function RazorpayCheckoutScreen({ route, navigation }) {
  const { orderId, amount, user, bookingId, paymentId, showId } = route.params;

  console.log("The data we received inside the checout screen:");
  console.log("The orderId is:", orderId);
  console.log("The amount is:", amount);
  console.log("The user is:", user);
  console.log("The bookingId is:", bookingId);
  console.log("The paymentId is:", paymentId);

  const html = `
    <html>
    <body>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <script>
        var options = {
          key: "rzp_test_h5bgZzCw9TQtTr",
          amount: ${amount},
          currency: "INR",
          name: "BookMyShow Clone",
          order_id: "${orderId}",
          prefill: {
            name: "${user.name}",
            email: "${user.email}",
            contact: "${user.phone}"
          },
          handler: function (response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: true,
              paymentId: "${paymentId}",
              bookingId: "${bookingId}",
              showId: "${showId}",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }));
          },
             modal: {
          ondismiss: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: false
            }));
          }
        }
        };
        var rzp = new Razorpay(options);
        rzp.open();
      </script>
    </body>
    </html>
  `;

  const onMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      console.log("Data received from WebView:", data);

      if (data.success) {
        // Payment completed in client: forward to VerifyPayment screen
        navigation.replace("VerifyPayment", {
          bookingId: data.bookingId,
          paymentId: data.paymentId,
          showId: data.showId,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        });
      } else {
        // Payment dismissed / failed by user -> notify backend to cancel & release seats
        try {
          // If you use auth token add it here:
          const token = await AsyncStorage.getItem("token");

          await fetch(`http://192.168.1.42:3000/api/Payment/cancel`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ bookingId, paymentDbId: paymentId }),
          });

          // Show message & go back
          Alert.alert("Payment Cancelled", "Payment was cancelled. Seats have been released.");
          navigation.goBack();
        } catch (err) {
          console.error("Error cancelling payment:", err);
          Alert.alert("Cancelled", "Payment cancelled. Please try again.");
          navigation.goBack();
        }
      }
    } catch (err) {
      console.error("Invalid message from WebView:", err);
      Alert.alert("Error", "Unexpected error from payment window.");
      navigation.goBack();
    }
  };

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      onMessage={onMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  );

}
