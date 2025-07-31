#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <TimeLib.h>
#include <FS.h>

// Konfigurasi WiFi
#define WIFI_SSID "NANNAN"
#define WIFI_PASSWORD "nannannan"

// Konfigurasi Firebase
#define FIREBASE_HOST "monitoringtanaman-76dab-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "UafdF5Ux2S0J0T1A6BjyD03vnC8WpaWrdReZSHTf"

// Pin Sensor & Relay
#define SOIL_SENSOR_PIN A0  
#define RELAY_ 5  //Relay untuk Air D1

// NTP setup
WiFiUDP udp;
NTPClient timeClient(udp, "pool.ntp.org", 0, 60000);

// Firebase Setup
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

// Variabel Global
String selectedPlant = ""; // Menyimpan tanaman yang dipilih
String statusESP = ""; // Menyimpan status yang dipilih
String statusRelayNutrisi = ""; // Menyimpan status pompa nutrisi

unsigned long lastReadTime = 0;  // Last time we read the soil sensor
unsigned long lastSendTime = 0;  // Last time we sent data to Firebase
unsigned long startTime = 0;
bool isWatering = false;

void setup() {
    Serial.begin(115200);
    SPIFFS.begin();  // Inisialisasi SPIFFS

    // Koneksi ke WiFi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Menghubungkan ke WiFi...");
    }
    Serial.println("Terhubung ke WiFi!");

    // Konfigurasi Firebase
    config.host = FIREBASE_HOST;
    config.signer.tokens.legacy_token = FIREBASE_AUTH;
    Firebase.begin(&config, &auth);
    Firebase.reconnectWiFi(true);

    // Inisialisasi pin
    pinMode(SOIL_SENSOR_PIN, INPUT);
    pinMode(RELAY, OUTPUT);
    digitalWrite(RELAY, HIGH);  // Matikan pompa saat awal

    // Inisialisasi NTP
    timeClient.begin();
    timeClient.setTimeOffset(25200); // UTC+7 (WIB)

    // Ambil pilihan tanaman dari Firebase
    getSelectedPlant();
    loadConfig();  // Memuat konfigurasi dari SPIFFS
}

void loop() {
    reconnectWiFiAndFirebase();  // Cek koneksi sebelum mengirim data

    checkPowerControl(); // Cek apakah ESP dari firebase
    powerControl(); // ESP perlu dimatikan atau dinyalakan

    checkPowerControlNutrisi(); // Cek apakah statusNutrisi dari firebase
    powerControlNutrisi(); //  Relay statusNutrisi perlu dimatikan atau dinyalakan

    // Membaca kelembaban tanah setiap 5 detik
    unsigned long currentMillis = millis();
    if (currentMillis - lastReadTime >= 5000) {  // Membaca sensor setiap 5 detik
        int soilMoisture = analogRead(SOIL_SENSOR_PIN);
        Serial.print("Kelembaban tanah: ");
        Serial.println(soilMoisture);
        lastReadTime = currentMillis;
        saveSoilMoisture(soilMoisture);
    }

    // Mengirimkan data ke Firebase setiap 1 menit
    if (currentMillis - lastSendTime >= 60000) {  // Setiap 1 menit
        getSelectedPlant();
        sendDataToFirebase(analogRead(SOIL_SENSOR_PIN));
        lastSendTime = currentMillis;
    }


}

// 🔹 Fungsi untuk mengecek status koneksi Wifi & Firebase
void reconnectWiFiAndFirebase() {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("⚠️ Koneksi WiFi terputus! Menghubungkan ulang...");
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        while (WiFi.status() != WL_CONNECTED) {
            delay(1000);
            Serial.print(".");
        }
        Serial.println("\n✅ WiFi terhubung kembali!");
    }

    if (!Firebase.ready()) {
        Serial.println("⚠️ Firebase tidak terhubung, mencoba kembali...");
        Firebase.begin(&config, &auth);
        Firebase.reconnectWiFi(true);
    }
}

// 🔹 Fungsi untuk mengecek status hidup/mati dari Firebase
void checkPowerControl() {
    if (Firebase.getString(firebaseData, "/selectedPlant/status")) {
        String powerStatus = firebaseData.stringData();

        if (powerStatus == "hidup" || powerStatus == "mati") {
            statusESP = powerStatus;
            Serial.print("Status ESP: ");
            Serial.println(statusESP);
        } else {
            Serial.println("⚠️ Gagal membaca status powerControl");
        }
    } else {
        Serial.println("⚠️ Gagal membaca status powerControl dari Firebase: " + firebaseData.errorReason());
    }
}

// 🔹 Fungsi untuk hidup/mati ESP8266
void powerControl() {
  if (statusESP != "hidup" && statusESP != "mati") {
        Serial.println("⚠️ Status ESP tidak dikenali.");
        return;
    }

    if (statusESP == "hidup") {
        Serial.println("✅ ESP8266 dalam kondisi HIDUP.");
        return;  // Lanjutkan operasi normal
    } else if (statusESP == "mati") {
        Serial.println("⚠️ ESP8266 akan mati sebentar...");
        delay(2000);
        ESP.restart();  // Restart ESP setiap 30 detik agar bisa kembali hidup
    }
}

// 🔹 Fungsi untuk mengecek status hidup/mati dari Firebase
void checkPowerControlNutrisi() {
    if (Firebase.getString(firebaseData, "/selectedPlant/statusNutrisi")) {
        String powerStatusNutrisi = firebaseData.stringData();

        if (powerStatusNutrisi == "hidup" || powerStatusNutrisi == "mati") {
            statusRelayNutrisi = powerStatusNutrisi;
            Serial.print("Status Relay Nutrisi: ");
            Serial.println(statusRelayNutrisi );
        } else {
            Serial.println("⚠️ Gagal membaca status powerControlNutrisi");
        }
    } else {
        Serial.println("⚠️ Gagal membaca status powerControlNutrisi dari Firebase: " + firebaseData.errorReason());
    }
}

// 🔹 Fungsi untuk hidup/mati Pompa Nutrisi
void powerControlNutrisi() {
    if (statusRelayNutrisi != "hidup" && statusRelayNutrisi != "mati") {
        Serial.println("⚠️ Status Relay Nutrisi tidak dikenali.");
        return;
    }

    // Jika status relay nutrisi mati, pastikan ESP tetap berjalan
    if (statusRelayNutrisi == "mati") {
        Serial.println("🔴 Relay Nutrisi Mati, menunggu penyiraman selanjutnya.");
        // Tidak ada tindakan lebih lanjut, tetapi program akan terus berjalan di loop utama
    }
}



// 🔹 Fungsi untuk membaca tanaman dari Firebase
void getSelectedPlant() {
    if (Firebase.getString(firebaseData, "/selectedPlant/nama")) {
        String newPlant = firebaseData.stringData();

        if (newPlant == "stroberi" || newPlant == "tomat") {
            selectedPlant = newPlant;
            Serial.print("Tanaman diperbarui: ");
            Serial.println(selectedPlant);
        } else {
            Serial.println("⚠️ Data dari Firebase tidak valid, menggunakan default.");
        }
    } else {
        Serial.println("⚠️ Gagal mengambil data dari Firebase: " + firebaseData.errorReason());
    }
}

// 🔹 Fungsi untuk mengirim data ke Firebase
void sendDataToFirebase(int soilMoisture) {
    if (selectedPlant != "stroberi" && selectedPlant != "tomat") {
        Serial.println("⚠️ Tanaman tidak dikenali, data tidak dikirim.");
        return;
    }

    // Menentukan kategori kelembapan tanah
    String kondisiTanah;
    int persentaseAir = 0;
    int hasilPersentase = 0;

    // Perhitungan persentase berdasarkan jenis tanaman stroberi
if (selectedPlant == "stroberi") {
    if (soilMoisture >= 0 && soilMoisture <= 150) { 
        kondisiTanah = "Kondisi Tanah Basah";
        persentaseAir = (int)(((float)soilMoisture / 150.0) * 30.0); 
        hasilPersentase = 100 - persentaseAir; // 100% - 70%
    } 
    else if (soilMoisture >= 151 && soilMoisture <= 300) { 
        kondisiTanah = "Kelembaban Normal";
        persentaseAir = (int)((((float)soilMoisture - 151.0) / 149.0) * 9.0); 
        hasilPersentase = 69 - persentaseAir; // 69% - 60%
    } 
    else if (soilMoisture >= 301 && soilMoisture <= 1023) { 
        kondisiTanah = "Kondisi Tanah Kering";
        persentaseAir = (int)((((float)soilMoisture - 301.0) / 722.0) * 59.0);
        hasilPersentase = 59 - persentaseAir; // 59% - 0%
    } 
    else {
        kondisiTanah = "Data tidak valid";
        hasilPersentase = -1;
    }
}




// Perhitungan persentase berdasarkan jenis tanaman tomat
if (selectedPlant == "tomat") {
    if (soilMoisture >= 0 && soilMoisture <= 150) { 
        kondisiTanah = "Kondisi Tanah Basah";
        persentaseAir = (int)(((float)soilMoisture / 150.0) * 20.0); 
        hasilPersentase = 100 - persentaseAir; // 100% - 80%
    } 
    else if (soilMoisture >= 151 && soilMoisture <= 300) { 
        kondisiTanah = "Kelembaban Normal";
        persentaseAir = (int)((((float)soilMoisture - 151.0) / 149.0) * 9.0); 
        hasilPersentase = 79 - persentaseAir; // 79% - 70%
    } 
    else if (soilMoisture >= 301 && soilMoisture <= 1023) { 
        kondisiTanah = "Kondisi Tanah Kering";
        persentaseAir = (int)((((float)soilMoisture - 301.0) / 722.0) * 69.0);
        hasilPersentase = 69 - persentaseAir; // 69% - 0%
    } 
    else {
        kondisiTanah = "Data tidak valid";
        hasilPersentase = -1;
    }
}


    // Menampilkan hasil
    Serial.print("📊 Kelembapan Tanah: ");
    Serial.print(soilMoisture);
    Serial.print(" | Kondisi: ");
    Serial.print(kondisiTanah);
    Serial.print(" | Persentase: ");
    Serial.print(hasilPersentase);
    Serial.println("%");

    // Kontrol pompa berdasarkan tanaman dan kelembapan
    if (hasilPersentase <= 59) {
        digitalWrite(RELAY, LOW);  // Nyalakan pompa
        Serial.println("Kelembapan tanah cabai rendah, pompa dinyalakan!");
        delay(15000);
        digitalWrite(RELAY, HIGH); // Matikan pompa
    } else if (hasilPersentase <= 69) {
        digitalWrite(RELAY, LOW);  // Nyalakan pompa
        Serial.println("Kelembapan tanah cabai rendah, pompa dinyalakan!");
        delay(15000);
        digitalWrite(RELAY, HIGH); // Matikan pompa
    } else {
        digitalWrite(RELAY, HIGH); // Matikan pompa
        Serial.println("Pompa mati.");
    }

    // Mendapatkan waktu saat ini
    timeClient.update();
    String currentTime = timeClient.getFormattedTime();
    time_t rawTime = timeClient.getEpochTime();
    struct tm *ptm = gmtime(&rawTime);
    String tanggal = String(ptm->tm_year + 1900) + "-" + String(ptm->tm_mon + 1) + "-" + String(ptm->tm_mday);
    String hari = getDayOfWeek(ptm->tm_wday);

    // Membuat JSON untuk dikirim ke Firebase
    FirebaseJson data;
    data.set("tanaman", selectedPlant);
    data.set("persentase", hasilPersentase);
    data.set("keterangan", kondisiTanah);
    data.set("kelembaban", soilMoisture);
    data.set("waktu", currentTime);
    data.set("tanggal", tanggal);
    data.set("hari", hari);

    // Membuat path penyimpanan data di Firebase
    String timestamp = String(rawTime);
    String path = "/selectedPlant/" + selectedPlant + "/sensorData/" + timestamp;

    // Mengirim data ke Firebase
    if (Firebase.setJSON(firebaseData, path.c_str(), data)) {
        Serial.println("✅ Data berhasil dikirim ke Firebase untuk " + selectedPlant);
    } else {
        Serial.println("❌ Gagal mengirim data ke Firebase untuk " + selectedPlant);
        Serial.println(firebaseData.errorReason());
    }
}

String getDayOfWeek(int day) {
    switch(day) {
        case 0: return "Minggu";
        case 1: return "Senin";
        case 2: return "Selasa";
        case 3: return "Rabu";
        case 4: return "Kamis";
        case 5: return "Jumat";
        case 6: return "Sabtu";
        default: return "Unknown";
    }
}

// 🔹 Fungsi untuk menyimpan data kelembaban tanah beserta waktu
void saveSoilMoisture(int soilMoisture) {
    timeClient.update();  // Perbarui waktu dari NTP
    String timestamp = timeClient.getFormattedTime(); // Ambil waktu dalam format HH:MM:SS

    File file = SPIFFS.open("/soilData.txt", "w");
    if (!file) {
        Serial.println("Gagal membuka file untuk menulis");
        return;
    }

    // Simpan data dalam format: kelembaban,tanggal,waktu
    file.print(soilMoisture);
    file.print(",");
    file.print(timeClient.getFormattedTime()); // Tanggal: YYYY-MM-DD
    file.print(",");
    file.print(timestamp); // Waktu: HH:MM:SS
    file.close();

    Serial.print("Data tersimpan: ");
    Serial.print(soilMoisture);
    Serial.print(" | ");
    Serial.print(timeClient.getFormattedTime());
    Serial.print(" ");
    Serial.println(timestamp);
}

// 🔹 Fungsi untuk membaca data kelembaban tanah dari SPIFFS
void loadConfig() {
    File file = SPIFFS.open("/soilData.txt", "r");
    if (!file) {
        Serial.println("File konfigurasi tidak ditemukan, menggunakan nilai default.");
        return;
    }

    String data = file.readString();
    Serial.print("Data kelembaban dari SPIFFS: ");
    Serial.println(data);
    file.close();
}