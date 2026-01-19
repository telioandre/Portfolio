# Téléphone IoT – Détails du projet

![Prototype IoT](../../assets/images/iot-phone.png)

## Contexte
Prototype de téléphone **IoT** avec connectivité réseau et interactions embarquées.

## Techniques
- C++/Arduino (microcontrôleur)
- Modules GSM/WiFi
- Communication MQTT/HTTP

## Extrait de code (MQTT Arduino)
```cpp
#include <PubSubClient.h>
WiFiClient espClient; PubSubClient client(espClient);
void setup(){
  WiFi.begin("ssid","pass");
  client.setServer("broker.hivemq.com", 1883);
}
void loop(){
  if(!client.connected()){ client.connect("iot-phone"); }
  client.publish("iot/phone/events", "CALL:123456789");
  client.loop();
}
```

## Médias
- Vidéo (placeholder): https://example.com/demo-iot
