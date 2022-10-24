function getQueryStringValue (str, domain) {
  str = str.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

  let regex = new RegExp("[\\?&]" + str + "=([^&#]*)");
  let results = regex.exec(domain);

  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

export default getQueryStringValue