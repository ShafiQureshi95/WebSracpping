const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the URL
  await page.goto('https://www.berlin.de/restaurants/stadtteile/');

  // Extract and print the list of city names
  const citiesToInclude = ['Charlottenburg', 'Friedrichshain', 'Hellersdorf', 'Hohenschönhausen', 'Köpenick', 'Kreuzberg', 'Lichtenberg', 'Marzahn', 'Mitte', 'Neukölln', 'Pankow', 'Prenzlauer Berg', 'Reinickendorf', 'Schöneberg', 'Spandau', 'Steglitz', 'Tempelhof', 'Tiergarten', 'Treptow', 'Wedding', 'Weißensee', 'Wilmersdorf', 'Zehlendorf'];
  const cityNames = await page.$$eval('h3.title a', (links, citiesToInclude) =>
    links
      .map(link => link.textContent.trim())
      .filter(name =>
        citiesToInclude.some(city => city.toLowerCase() === name.toLowerCase())
      ), citiesToInclude
  );
  
  console.log(cityNames)
  // Loop through each city and scrape restaurant names
  const cityName = 'Charlottenburg'
  const cityNameToBeReplaced = ['Hohenschönhausen','Köpenick','Neukölln','schoeneberg','weissensee']
  const cityNamesCorrected = ['hohenschoenhausen','koepenick','neukoelln','schoeneberg','weissensee']
  const correctCityPlace = replaceCityName(cityName)
  function replaceCityName(cityName) {
    const index = cityNameToBeReplaced.indexOf(cityName);
    if (index !== -1) {
        return cityNamesCorrected[index];
    }
    return cityName;
}
  console.log(correctCityPlace)
  const cityUrl = `https://www.berlin.de/restaurants/stadtteile/${encodeURIComponent(correctCityPlace.toLowerCase())}/`;
  console.log(cityUrl)
  await page.goto(cityUrl);

  const cityWithList = ['Charlottenburg', 'Friedrichshain', 'Kreuzberg', 'Mitte', 'Prenzlauer Berg']
  if (cityWithList.includes(correctCityPlace)) {
    const restaurantNames = await page.$$eval(
      'ul.list--arrowlist li a',
      (elements) => elements.map((element) => element.textContent.trim())
    );
    console.log(`Restaurants in ${correctCityPlace}:`, restaurantNames);
  } else {
    const restaurantNames = await page.$$eval(
      'article.modul-teaser.teaser--place.basis .title',
      (elements) => elements.map((element) => element.textContent.trim())
    );
    console.log(`Restaurants in ${correctCityPlace}:`, restaurantNames);
  }


  await browser.close();
})();
