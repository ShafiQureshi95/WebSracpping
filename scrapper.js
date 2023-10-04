const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://www.berlin.de/restaurants/stadtteile/');

    const citiesToInclude = ['Charlottenburg', 'Friedrichshain', 'Hellersdorf', 'Hohenschönhausen', 'Köpenick', 'Kreuzberg', 'Lichtenberg', 'Marzahn', 'Mitte', 'Neukölln', 'Pankow', 'Prenzlauer Berg', 'Reinickendorf', 'Schöneberg', 'Spandau', 'Steglitz', 'Tempelhof', 'Tiergarten', 'Treptow', 'Wedding', 'Weißensee', 'Wilmersdorf', 'Zehlendorf'];

    const cityNames = await page.$$eval('h3.title a', (links, citiesToInclude) =>
      links
        .map(link => link.textContent.trim())
        .filter(name =>
          citiesToInclude.some(city => city.toLowerCase() === name.toLowerCase())
        ), citiesToInclude
    );

    const cityData = [];

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
        restaurantNames = await page.$$eval(
          'ul.list--arrowlist li a',
          (elements) => elements.map((element) => element.textContent.trim())
        );
      } else {
        restaurantNames = await page.$$eval(
          'article.modul-teaser.teaser--place.basis .title',
          (elements) => elements.map((element) => element.textContent.trim())
        );
      }

      cityData.push({
        cityName: correctCityPlace,
        cityUrl: cityUrl,
        restaurantNames: restaurantNames
      });
    }

    // Save data to a JSON file
    const jsonOutput = JSON.stringify(cityData, null, 2);
    fs.writeFileSync('city_restaurants.json', jsonOutput);

    console.log('Data saved to city_restaurants.json');
  } catch (error) {
    console.error(error);
  } finally {
    await browser.close();
  }
})();
