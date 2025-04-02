      let allCountries = [];
      let currentCountry = null;
      const newsAPIKey = "1fa7342b1a7041b0871704b69bc123e4"; // Replace with your NewsAPI.org API key
    
    

    document.addEventListener('click', (event) => {
        if (event.target.closest('.country-card')) {
            const countryDetailsSection = document.getElementById('countryDetails');
            countryDetailsSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
      // Fetch all countries on page load
      async function fetchCountries() {
          try {
              showLoading();
              const response = await fetch('https://restcountries.com/v3.1/all');
              allCountries = await response.json();
              displaySuggestedCountries();
          } catch (error) {
              showError('Failed to load country data');
          } finally {
              hideLoading();
          }
      }

      // Display suggested countries
      function displaySuggestedCountries() {
          const suggested = ['USA', 'FRA', 'JPN', 'BRA', 'ZAF', 'AUS'];
          const countryGrid = document.getElementById('countryGrid');
          suggested.forEach(code => {
              const country = allCountries.find(c => c.cca3 === code);
              if (country) {
                  countryGrid.appendChild(createCountryCard(country));
              }
          });
      }

      // Create country card element
      function createCountryCard(country) {
          const card = document.createElement('div');
          card.className = 'country-card';
          card.innerHTML = `
              <img src="${country.flags.png}" class="country-flag" alt="${country.name.common} flag">
              <h3>${country.name.common}</h3>
              <p>${country.region}</p>
          `;
          card.addEventListener('click', () => showCountryDetails(country));
          return card;
      }

      // Show country details and fetch related data
      async function showCountryDetails(country) {
          currentCountry = country;
          document.getElementById('countryDetails').style.display = 'block';
          
          // Basic info
          document.getElementById('countryName').textContent = country.name.common;
          document.getElementById('countryCapital').textContent = country.capital ? country.capital[0] : 'N/A';
          document.getElementById('countryPopulation').textContent = country.population.toLocaleString();
          document.getElementById('countryRegion').textContent = country.region;
          document.getElementById('countryLanguages').textContent = 
              country.languages ? Object.values(country.languages).join(', ') : 'N/A';

          // Currency setup
          const currencySelect = document.getElementById('targetCurrency');
          currencySelect.innerHTML = country.currencies 
              ? Object.keys(country.currencies).map(code => 
                  `<option value="${code}">${country.currencies[code].name} (${code})</option>`
                ).join('') 
              : '<option>No currency data</option>';

          // Fetch Wikipedia facts
          try {
              const response = await fetch(
                  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country.name.common)}`
              );
              const data = await response.json();
              document.getElementById('countryFacts').innerHTML = 
                  data.extract_html || '<p>No additional information available</p>';
          } catch (error) {
              document.getElementById('countryFacts').innerHTML = 
                  '<p>Could not load additional information</p>';
          }

          // Fetch weather forecast based on country coordinates
          fetchWeather(country);

          // Fetch news headlines using the two-letter country code (cca2)
          if (country.cca2) {
              fetchNews(country.cca2.toLowerCase());
          } else {
              document.getElementById('newsHeadlines').innerHTML = '<p>No news available</p>';
          }
      }

      // Fetch weather forecast from Open-Meteo API
      function fetchWeather(country) {
          const latlng = country.latlng;
          if (latlng && latlng.length >= 2) {
              const lat = latlng[0];
              const lng = latlng[1];
              const timezone = country.timezones ? country.timezones[0] : 'UTC';
              fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(timezone)}`)
                  .then(response => response.json())
                  .then(data => displayWeather(data))
                  .catch(error => {
                      document.getElementById('weatherData').innerHTML = '<p>Failed to load weather data.</p>';
                  });
          } else {
              document.getElementById('weatherData').innerHTML = '<p>No weather data available for this country.</p>';
          }
      }

      // Display weather forecast
      function displayWeather(data) {
          const weatherContainer = document.getElementById('weatherData');
          if (data.daily && data.daily.time) {
              const days = data.daily.time;
              const tempsMax = data.daily.temperature_2m_max;
              const tempsMin = data.daily.temperature_2m_min;
              let forecastHTML = '';
              const count = Math.min(5, days.length);
              for (let i = 0; i < count; i++) {
                  forecastHTML += `
                      <div class="weather-day">
                          <p><strong>${days[i]}</strong></p>
                          <p>High: ${tempsMax[i]}°</p>
                          <p>Low: ${tempsMin[i]}°</p>
                      </div>
                  `;
              }
              weatherContainer.innerHTML = forecastHTML;
          } else {
              weatherContainer.innerHTML = '<p>No weather forecast available.</p>';
          }
      }
    // Fetch images from Unsplash API
    const imagesSection = document.createElement('div');
    imagesSection.className = 'images-section';
    imagesSection.innerHTML = `
        <h3>Images</h3>
        <div id="countryImages" class="image-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; overflow: hidden;"></div>
    `;
    const newsSection = document.getElementById('newsSection');
    newsSection.parentNode.insertBefore(imagesSection, newsSection);
    async function fetchCountryImages(countryName) {
        const unsplashAccessKey = "Aem7rKnm0mwniG-qnsai1SE5fX-d5vMPqkGkJT8fVf0"; // Replace with your Unsplash API access key
        try {
          const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(countryName)}&per_page=9&client_id=${unsplashAccessKey}`
          );
          const imageData = await response.json();
          displayCountryImages(imageData.results);
        } catch (error) {
          document.getElementById('countryImages').innerHTML = '<p>Failed to load images.</p>';
        }
    }

    // Display images in a grid
    function displayCountryImages(images) {
        const imageGrid = document.getElementById('countryImages');
        if (images && images.length) {
          imageGrid.innerHTML = images.map(image => `
            <div class="image-card">
                <img src="${image.urls.small}" alt="${image.alt_description}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 10px;">
            </div>
          `).join('');
        } else {
          imageGrid.innerHTML = '<p>No images found for this country.</p>';
        }
    }

    // Call Unsplash API when showing country details
    async function showCountryDetails(country) {
        currentCountry = country;
        document.getElementById('countryDetails').style.display = 'block';
        
        // Basic info
        document.getElementById('countryName').textContent = country.name.common;
        document.getElementById('countryCapital').textContent = country.capital ? country.capital[0] : 'N/A';
        document.getElementById('countryPopulation').textContent = country.population.toLocaleString();
        document.getElementById('countryRegion').textContent = country.region;
        document.getElementById('countryLanguages').textContent = 
          country.languages ? Object.values(country.languages).join(', ') : 'N/A';

        // Currency setup
        const currencySelect = document.getElementById('targetCurrency');
        currencySelect.innerHTML = country.currencies 
          ? Object.keys(country.currencies).map(code => 
            `<option value="${code}">${country.currencies[code].name} (${code})</option>`
            ).join('') 
          : '<option>No currency data</option>';

        // Fetch Wikipedia facts
        try {
          const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(country.name.common)}`
          );
          const data = await response.json();
          document.getElementById('countryFacts').innerHTML = 
            data.extract_html || '<p>No additional information available</p>';
        } catch (error) {
          document.getElementById('countryFacts').innerHTML = 
            '<p>Could not load additional information</p>';
        }

        // Fetch weather forecast based on country coordinates
        fetchWeather(country);

        // Fetch news headlines using the two-letter country code (cca2)
        if (country.cca2) {
          fetchNews(country.cca2.toLowerCase());
        } else {
          document.getElementById('newsHeadlines').innerHTML = '<p>No news available</p>';
        }

        // Fetch images from Unsplash
        fetchCountryImages(country.name.common);
    }
      // Fetch news headlines from NewsAPI.org
      async function fetchNews(countryCode) {
          try {
              const response = await fetch(
                  `https://newsapi.org/v2/top-headlines?country=${countryCode}&apiKey=${newsAPIKey}`
              );
              const newsData = await response.json();
              const newsContainer = document.getElementById('newsHeadlines');
              if (newsData.articles && newsData.articles.length) {
                  newsContainer.innerHTML = newsData.articles.map(article => `
                      <div class="news-article">
                          <a href="${article.url}" target="_blank">${article.title}</a>
                      </div>
                  `).join('');
              } else {
                  newsContainer.innerHTML = '<p>No news articles found for this country.</p>';
              }
          } catch (error) {
              document.getElementById('newsHeadlines').innerHTML = '<p>Failed to load news.</p>';
          }
      }

      // Currency conversion
      async function convertCurrency() {
          const amount = document.getElementById('amount').value;
          const targetCurrency = document.getElementById('targetCurrency').value;
          
          try {
              const response = await fetch(
                  `https://api.exchangerate-api.com/v4/latest/USD`
              );
              const rates = await response.json();
              
              if (!currentCountry?.currencies) {
                  throw new Error('No currency information available');
              }
              const rate = rates.rates[targetCurrency];
              const result = (amount * rate).toFixed(2);
              
              document.getElementById('conversionResult').innerHTML = `
                  ${amount} USD = ${result} ${targetCurrency}
              `;
          } catch (error) {
              showError('Currency conversion failed');
          }
      }

      // Search functionality
      async function searchCountry() {
          const query = document.getElementById('searchInput').value.toLowerCase();
          if (!query) return;

          try {
              showLoading();
              const response = await fetch(`https://restcountries.com/v3.1/name/${query}`);
              const countries = await response.json();
              
              const countryGrid = document.getElementById('countryGrid');
              countryGrid.innerHTML = '';
              countries.forEach(country => {
                  countryGrid.appendChild(createCountryCard(country));
              });
          } catch (error) {
              showError('Country not found');
          } finally {
              hideLoading();
          }
      }

      // Helper functions
      function showLoading() {
          document.getElementById('loading').style.display = 'block';
      }

      function hideLoading() {
          document.getElementById('loading').style.display = 'none';
      }

      function showError(message) {
          document.getElementById('error').textContent = message;
          document.getElementById('error').style.display = 'block';
          setTimeout(() => {
              document.getElementById('error').style.display = 'none';
          }, 3000);
      }

      // Initialize
      fetchCountries();
