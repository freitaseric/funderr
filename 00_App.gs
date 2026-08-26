function doGet() {
  const template =
    HtmlService.createTemplateFromFile(
      'Index'
    );

  const rawKey =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'GOOGLE_MAPS_API_KEY'
      );

  template.mapsApiKey =
    String(
      rawKey || ''
    ).trim();

  return template
    .evaluate()
    .setTitle('FUNDERR')
    .setFaviconUrl('https://cdn.freitaseric.com/iater/funderr_favicon.png');
}


function include_(arquivo) {
  return HtmlService
    .createHtmlOutputFromFile(
      arquivo
    )
    .getContent();
}
