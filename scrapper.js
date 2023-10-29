const puppeteer = require('puppeteer');
const fs = require('fs');


(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    try {
      await page.goto('https://www.berlin.de/restaurants/stadtteile/', { timeout: 30000 });
    } catch (error) {
      console.error('Navigation timeout error:', error);
  
    }

    const citiesToInclude = ['Charlottenburg', 'Friedrichshain', 'Hellersdorf', 'Hohenschönhausen', 'Köpenick', 'Kreuzberg', 'Lichtenberg', 'Marzahn', 'Mitte', 'Neukölln', 'Pankow', 'Prenzlauer Berg', 'Reinickendorf', 'Schöneberg', 'Spandau', 'Steglitz', 'Tempelhof', 'Tiergarten', 'Treptow', 'Wedding', 'Weißensee', 'Wilmersdorf', 'Zehlendorf'];

    const cityNames = await page.$$eval('h3.title a', (links, citiesToInclude) =>
      links
        .map(link => link.textContent.trim())
        .filter(name =>
          citiesToInclude.some(city => city.toLowerCase() === name.toLowerCase())
        ), citiesToInclude
    );

    const cityData = [];
    const restaurantList = [];

    for (const cityName of cityNames) {
      const cityNameToBeReplaced = ['Hohenschönhausen', 'Köpenick', 'Neukölln', 'Schöneberg', 'Weißensee'];
      const cityNamesCorrected = ['hohenschoenhausen', 'koepenick', 'neukoelln', 'schoeneberg', 'weissensee'];

      const correctCityPlace = replaceCityName(cityName);

      function replaceCityName(cityName) {
        const index = cityNameToBeReplaced.indexOf(cityName);
        if (index !== -1) {
          return cityNamesCorrected[index];
        }
        return cityName;
      }

      const cityUrl = `https://www.berlin.de/restaurants/stadtteile/${encodeURIComponent(correctCityPlace.toLowerCase())}/`;

      await page.goto(cityUrl);

      const cityWithList = ['Charlottenburg', 'Friedrichshain', 'Kreuzberg', 'Mitte', 'Prenzlauer Berg'];
      let restaurantNames = [];


      if (cityWithList.includes(correctCityPlace)) {
        const restaurants = await page.$$('ul.list--arrowlist li a');

        for (const restaurant of restaurants) {
          const name = await page.evaluate(element => element.textContent.trim(), restaurant);
          let sourceUrl = await page.evaluate(element => element.getAttribute('href'), restaurant);
          const urlToTrim = sourceUrl
          const parts = urlToTrim.split('/');

          const typeIndex = parts.indexOf('adressen') + 1;
          let category = parts[typeIndex];
          category = category.replace('-restaurant', '');
          const baseUrl = "https://www.berlin.de";
          sourceUrl = baseUrl + sourceUrl
          restaurantNames.push({ name, sourceUrl, category });
        }
      } else {
        restaurantNames = await page.$$eval(
          'article.modul-teaser.teaser--place.basis',
          (elements) => elements.map((element) => {
            const name = element.querySelector('.title').textContent.trim();
            let sourceUrl = element.querySelector('a.more').getAttribute('href');
            const urlToTrim = sourceUrl
            const parts = urlToTrim.split('/');

            const typeIndex = parts.indexOf('adressen') + 1;
            let category = parts[typeIndex];

            category = category.replace('-restaurant', '');
            const baseUrl = "https://www.berlin.de";
            sourceUrl = baseUrl + sourceUrl
            return { name, sourceUrl, category };
          })
        );
      }

      for (const restaurant of restaurantNames) {
        const { sourceUrl } = restaurant;

        await page.goto(sourceUrl);

        const restaurantData = await page.evaluate(() => {
          const nameElement = document.querySelector('.list--contact div:first-child');
          const addressElement = document.querySelector('.list--contact div:nth-child(2)');
          const cityDistrictElement = document.querySelector('.list--contact span');
          const phoneElement = document.querySelector('.list--contact dt.tel + dd span a');
          const streetElement = document.querySelector('.list--contact div:nth-child(2)');
          const codeElement = document.querySelector('.list--contact span');

          let street = null;
          let code = null;
        
          if (streetElement) {
            street = streetElement.textContent.trim();
          }
          if (codeElement) {
            const parts = codeElement.textContent.trim().split('–');
            code = parts[0].trim();
          }
        
          let cityDistrict = null;
        
          if (cityDistrictElement) {
            const parts = cityDistrictElement.textContent.trim().split('–');
            cityDistrict = parts[parts.length - 1].trim();
          }
        
          let streetName = null;
          let postalCode = null;
          let district = null;
        
          if (addressElement) {
            const addressParts = addressElement.textContent.trim().split('\n').map(part => part.trim());
            streetName = addressParts[0];
            const postalCodeAndDistrict = addressParts[1];
            if (postalCodeAndDistrict) {
              const postalCodeAndDistrictParts = postalCodeAndDistrict.split(' ');
              postalCode = postalCodeAndDistrictParts[0];
              district = postalCodeAndDistrictParts.slice(1).join(' ');
            }
          }
        
          const fullAddress = nameElement && addressElement ? nameElement.textContent.trim() + ' ' + addressElement.textContent.trim() : null;
          
          return {
            streetName,
            postalCode,
            district,
            address: street + code,
            cityDistrict,
            Telefon: phoneElement ? phoneElement.textContent.trim() : null
          };
        });
        

        restaurant.address = restaurantData.address;
        restaurant.cityDistrict = restaurantData.cityDistrict;
        restaurant.Telefon = restaurantData.Telefon;
      }

      // cityData.push({
      //   cityName: correctCityPlace,
      //   cityUrl: cityUrl,
      //   restaurantNames: restaurantNames
      // });

      for (const restaurant of restaurantNames) {
        restaurantList.push({
          name: restaurant.name,
          sourceUrl: restaurant.sourceUrl,
          category: restaurant.category,
          address: restaurant.address,
          cityDistrict: restaurant.cityDistrict,
          Telefon: restaurant.Telefon,
        });
      }

    }

    
    const jsonOutput = JSON.stringify(restaurantList, null, 2);
    fs.writeFileSync('city_restaurants.json', jsonOutput);

    console.log('Data saved to city_restaurants.json');
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
