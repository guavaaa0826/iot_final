// Connection
#include <LWiFi.h>
#include <PubSubClient.h>

// Ultrasonic
#include "Ultrasonic.h"

// Grove IMU 9DOF
#include "Wire.h"
#include "I2Cdev.h"
#include "MPU9250.h"
#include "BMP180.h"

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
Ultrasonic ultrasonic(2);

// IMU 9DOF
MPU9250 accelgyro;
I2Cdev   I2C_M;

uint8_t buffer_m[6];

int16_t ax, ay, az;
int16_t gx, gy, gz;
int16_t   mx, my, mz;

float heading;
float tiltheading;

float Axyz[3];
float Gxyz[3];
float Mxyz[3];

#define sample_num_mdate  5000

volatile float mx_sample[3];
volatile float my_sample[3];
volatile float mz_sample[3];

static float mx_centre = 0;
static float my_centre = 0;
static float mz_centre = 0;

volatile int mx_max = 0;
volatile int my_max = 0;
volatile int mz_max = 0;

volatile int mx_min = 0;
volatile int my_min = 0;
volatile int mz_min = 0;

float temperature;
float pressure;
float atm;
float altitude;
BMP180 Barometer;


// Function prototypes
void setup_wifi();
void printWifiStatus();
void reconnect();
void callback(char* topic, byte* payload, unsigned int length);

void setup() {
    Wire.begin();
    Serial.begin(9600);
    // initialize device
    Serial.println("Initializing I2C devices...");
    accelgyro.initialize();
    Barometer.init();

    delay(1000);

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

    getAccel_Data();
    getGyro_Data();
    getCompassDate_calibrated(); // compass data has been calibrated here
    getHeading();               //before we use this function we should run 'getCompassDate_calibrated()' frist, so that we can get calibrated data ,then we can get correct angle .
    getTiltHeading();

    
    Serial.println("Acceleration(g) of X,Y,Z:");
    Serial.print(Axyz[0]);
    Serial.print(",");
    Serial.print(Axyz[1]);
    Serial.print(",");
    Serial.println(Axyz[2]);

    char char_x[5], char_y[5], char_z[5];
    floatToHex(Axyz[0], char_x);
    floatToHex(Axyz[1], char_y);
    floatToHex(Axyz[2], char_z);

    // Create JSON payload
    char acc_data[59];
    sprintf(acc_data, "[{\"macAddr\": \"0000000091499c95\",\"data\":\"0271%s%s%s\"}]", char_x, char_y, char_z);

    // Publish data every 0.5 seconds
    delay(500);
    byte* acc_p = (byte*)malloc(sizeof(acc_data));
    memcpy(acc_p, &acc_data, sizeof(acc_data));
    client.publish("GIOT/UL/CS423500", acc_p, sizeof(acc_data));
    free(acc_p);
    client.loop();

}

void floatToHex(float value, char* result) {
    int intValue = (int)(value * 255 / 2);

    for (int i = 0; i < 4; i++) {
        int tmp = intValue & 0xF;
        if (tmp >= 10) {
            result[3 - i] = 'A' + (tmp - 10);
        } else {
            result[3 - i] = '0' + tmp;
        }
        intValue >>= 4;
    }
    result[4] = '\0';
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




void getHeading(void)
{
    heading = 180 * atan2(Mxyz[1], Mxyz[0]) / PI;
    if (heading < 0) heading += 360;
}

void getTiltHeading(void)
{
    float pitch = asin(-Axyz[0]);
    float roll = asin(Axyz[1] / cos(pitch));

    float xh = Mxyz[0] * cos(pitch) + Mxyz[2] * sin(pitch);
    float yh = Mxyz[0] * sin(roll) * sin(pitch) + Mxyz[1] * cos(roll) - Mxyz[2] * sin(roll) * cos(pitch);
    float zh = -Mxyz[0] * cos(roll) * sin(pitch) + Mxyz[1] * sin(roll) + Mxyz[2] * cos(roll) * cos(pitch);
    tiltheading = 180 * atan2(yh, xh) / PI;
    if (yh < 0)    tiltheading += 360;
}



void Mxyz_init_calibrated ()
{

    Serial.println(F("Before using 9DOF,we need to calibrate the compass frist,It will takes about 2 minutes."));
    Serial.print("  ");
    Serial.println(F("During  calibratting ,you should rotate and turn the 9DOF all the time within 2 minutes."));
    Serial.print("  ");
    Serial.println(F("If you are ready ,please sent a command data 'ready' to start sample and calibrate."));
    while (!Serial.find("ready"));
    Serial.println("  ");
    Serial.println("ready");
    Serial.println("Sample starting......");
    Serial.println("waiting ......");

    get_calibration_Data ();

    Serial.println("     ");
    Serial.println("compass calibration parameter ");
    Serial.print(mx_centre);
    Serial.print("     ");
    Serial.print(my_centre);
    Serial.print("     ");
    Serial.println(mz_centre);
    Serial.println("    ");
}


void get_calibration_Data ()
{
    for (int i = 0; i < sample_num_mdate; i++)
    {
        get_one_sample_date_mxyz();
        /*
        Serial.print(mx_sample[2]);
        Serial.print(" ");
        Serial.print(my_sample[2]);                            //you can see the sample data here .
        Serial.print(" ");
        Serial.println(mz_sample[2]);
        */



        if (mx_sample[2] >= mx_sample[1])mx_sample[1] = mx_sample[2];
        if (my_sample[2] >= my_sample[1])my_sample[1] = my_sample[2]; //find max value
        if (mz_sample[2] >= mz_sample[1])mz_sample[1] = mz_sample[2];

        if (mx_sample[2] <= mx_sample[0])mx_sample[0] = mx_sample[2];
        if (my_sample[2] <= my_sample[0])my_sample[0] = my_sample[2]; //find min value
        if (mz_sample[2] <= mz_sample[0])mz_sample[0] = mz_sample[2];

    }

    mx_max = mx_sample[1];
    my_max = my_sample[1];
    mz_max = mz_sample[1];

    mx_min = mx_sample[0];
    my_min = my_sample[0];
    mz_min = mz_sample[0];



    mx_centre = (mx_max + mx_min) / 2;
    my_centre = (my_max + my_min) / 2;
    mz_centre = (mz_max + mz_min) / 2;

}






void get_one_sample_date_mxyz()
{
    getCompass_Data();
    mx_sample[2] = Mxyz[0];
    my_sample[2] = Mxyz[1];
    mz_sample[2] = Mxyz[2];
}

// yes
void getAccel_Data(void)
{
    accelgyro.getMotion9(&ax, &ay, &az, &gx, &gy, &gz, &mx, &my, &mz);
    Axyz[0] = (double) ax / 16384;
    Axyz[1] = (double) ay / 16384;
    Axyz[2] = (double) az / 16384;
}

void getGyro_Data(void)
{
    accelgyro.getMotion9(&ax, &ay, &az, &gx, &gy, &gz, &mx, &my, &mz);
    Gxyz[0] = (double) gx * 250 / 32768;
    Gxyz[1] = (double) gy * 250 / 32768;
    Gxyz[2] = (double) gz * 250 / 32768;
}

void getCompass_Data(void)
{
    I2C_M.writeByte(MPU9150_RA_MAG_ADDRESS, 0x0A, 0x01); //enable the magnetometer
    delay(10);
    I2C_M.readBytes(MPU9150_RA_MAG_ADDRESS, MPU9150_RA_MAG_XOUT_L, 6, buffer_m);

    mx = ((int16_t)(buffer_m[1]) << 8) | buffer_m[0] ;
    my = ((int16_t)(buffer_m[3]) << 8) | buffer_m[2] ;
    mz = ((int16_t)(buffer_m[5]) << 8) | buffer_m[4] ;

    Mxyz[0] = (double) mx * 1200 / 4096;
    Mxyz[1] = (double) my * 1200 / 4096;
    Mxyz[2] = (double) mz * 1200 / 4096;
}

void getCompassDate_calibrated ()
{
    getCompass_Data();
    Mxyz[0] = Mxyz[0] - mx_centre;
    Mxyz[1] = Mxyz[1] - my_centre;
    Mxyz[2] = Mxyz[2] - mz_centre;
}
