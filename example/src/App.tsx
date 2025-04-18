import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ChatScreen from "./Chat";
import TestScreen from "./LLMTest";
import { ModelProvider } from "./ModelProvider";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ModelProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;

                if (route.name === "Test") {
                  iconName = focused ? "flask" : "flask-outline";
                } else if (route.name === "Chat") {
                  iconName = focused ? "chatbubbles" : "chatbubbles-outline";
                }

                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: "#0066cc",
              tabBarInactiveTintColor: "gray",
            })}
          >
            <Tab.Screen
              name="Test"
              component={TestScreen}
              options={{
                title: "LLM Test",
              }}
            />
            <Tab.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                title: "AI Chat",
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </ModelProvider>
    </SafeAreaProvider>
  );
}
