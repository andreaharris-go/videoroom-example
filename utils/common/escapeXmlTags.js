function escapeXmlTags(value) {
  if(value) {
    let escapedValue = value.replace(new RegExp('<', 'g'), '&lt');
    escapedValue = escapedValue.replace(new RegExp('>', 'g'), '&gt');

    return escapedValue;
  }

  return '';
}

export default escapeXmlTags;