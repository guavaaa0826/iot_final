#include <LWiFi.h>
#include <PubSubClient.h>
#include "Ultrasonic.h"

// WiFi credentials
char ssid[] = "林頎彧的wifi";
char password[] = "61467583";

// MQTT server details
char mqtt_server[] = "mqtt-dev.kits.tw";
char sub_topic[] = "GIOT/UL/CS423500";
char client_Id[] = "linkit-7697";

// WiFi and MQTT status
int status = WL_IDLE_STATUS;
WiFiClient mtclient;
PubSubClient client(mtclient);

// Ultrasonic sensor instance
Ultrasonic ultrasonic(10);

// Function prototypes
void setup_wifi();
void printWifiStatus();
void reconnect();
void callback(char* topic, byte* payload, unsigned int length);

void setup() {
    Serial.begin(9600);
    setup_wifi();
    
    // Set up MQTT client
    client.setServer(mqtt_server, 1883);
    client.setCallback(callback);
}

void loop() {
    // Reconnect if not connected
    if (!client.connected()) {
        reconnect();
    }

    // Measure distance with the Ultrasonic sensor
    long RangeInCentimeters = ultrasonic.MeasureInCentimeters();
    RangeInCentimeters *= 100;

    // Convert distance to a hexadecimal string
    char longtochar[5];
    for (int i = 0; i < 4; i++) {
        int tmp = RangeInCentimeters % 16;
        if (tmp >= 10) {
            longtochar[3 - i] = 'A' + (tmp - 10);
        } else {
            longtochar[3 - i] = '0' + tmp;
        }
        RangeInCentimeters /= 16;
    }
    longtochar[4] = '\0';

    // Create JSON payload
    char data[51];
    sprintf(data, "[{\"macAddr\": \"0000000091499c95\",\"data\":\"0280%s\"}]", longtochar);

    // Publish data every 0.5 seconds
    delay(500);
    byte* p = (byte*)malloc(sizeof(data));
    memcpy(p, &data, sizeof(data));
    client.publish("GIOT/UL/CS423500", p, sizeof(data));
    free(p);
    client.loop();
}

// Print WiFi connection status
void printWifiStatus() {
    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());

    IPAddress ip = WiFi.localIP();
    Serial.print("IP Address: ");
    Serial.println(ip);

    long rssi = WiFi.RSSI();
    Serial.print("Signal strength (RSSI):");
    Serial.print(rssi);
    Serial.println(" dBm");
}

// Connect to WiFi
void setup_wifi() {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    randomSeed(micros());
    Serial.println("Connected to WiFi");
    printWifiStatus();
}

// Reconnect to MQTT
void reconnect() {
    while (!client.connected()) {
        Serial.print("Attempting MQTT connection...");
        String clientId = client_Id;
        clientId += String(random(0xffff), HEX);

        if (client.connect(clientId.c_str())) {
            Serial.println("connected");
            client.subscribe(sub_topic);
        } else {
            Serial.print("failed, rc=");
            Serial.print(client.state());
            Serial.println(" try again in 5 seconds");
            delay(5000);
        }
    }
}

// Callback function for MQTT
void callback(char* topic, byte* response, unsigned int length) {
    Serial.print("Input Message arrived [");
    Serial.print(sub_topic);
    Serial.print("] response: ");

    for (unsigned int i = 0; i < length; i++) {
        Serial.print((char)response[i]);
    }

    Serial.println();
}
