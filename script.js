const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const light = new THREE.PointLight(0xffffff, 1.5);
light.position.set(5, 3, 5);
scene.add(light);

const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('assets/earth.jpg'); // assets klasöründe

const geometry = new THREE.SphereGeometry(1, 64, 64);
const material = new THREE.MeshPhongMaterial({ map: earthTexture });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

camera.position.z = 3;

// --- Yeni değişkenler ---
let targetCameraZ = 3;
let targetRotationY = 0;
let ownRotationSpeed = 0.0015; // Dünyanın kendi dönüş hızı

// Açı farkını -π ile +π arasında normalize eden fonksiyon
function shortestAngleDist(current, target) {
  const max = Math.PI * 2;
  let delta = (target - current) % max;
  if (delta > Math.PI) delta -= max;
  if (delta < -Math.PI) delta += max;
  return delta;
}

function animate() {
  requestAnimationFrame(animate);

  // Kamera zoom animasyonu
  camera.position.z += (targetCameraZ - camera.position.z) * 0.1;

  // Hedefe en kısa açı farkıyla yaklaş
  let deltaRot = shortestAngleDist(earth.rotation.y, targetRotationY);
  earth.rotation.y += deltaRot * 0.1; // Hedefe yumuşak yaklaşma

  // Dünyanın kendi sabit dönüşü ekle
  earth.rotation.y += ownRotationSpeed;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----------------- Hava durumu API kısmı -------------------
const apiKey = 'a0135c1abcdd4309e9160514835db9f2';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';

const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');

searchButton.addEventListener('click', () => {
  const location = locationInput.value;
  if (location) {
    fetchWeather(location);
  }
});

function fetchWeather(location) {
  const url = `${apiUrl}?q=${location}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      locationElement.textContent = data.name;
      temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
      descriptionElement.textContent = data.weather[0].description;

      // Koordinatları al ve radyana çevir
      const lat = data.coord.lat * (Math.PI / 180);
      const lon = data.coord.lon * (Math.PI / 180);

      // Konsola log ile kontrol (isteğe bağlı)
      console.log(`lon(rad): ${lon.toFixed(4)}, targetRotationY hesaplanıyor...`);

      // Hedef rotasyon açısını hesapla (longitude’ya göre)
      targetRotationY = (-lon + Math.PI) % (2 * Math.PI);

      // Kamera yakınlaşması (zoom in)
      targetCameraZ = 1.8;

      // 3 saniye sonra hedef rotasyonu sıfırlama (dünyanın sabit dönüşü devam eder)
      setTimeout(() => {
        targetRotationY = earth.rotation.y; // Şu anki rotasyona eşitle, ani ters dönüş olmasın
        // targetCameraZ'yi değiştirme, zoom kalır
      }, 3000);
    })
    .catch(error => {
      console.error('Hava durumu verisi alınamadı:', error);
    });
}