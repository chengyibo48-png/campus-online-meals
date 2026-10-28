// Compatibility entry: live weather removed by user. No provider or network request.
export async function loadWeather(element){
 if(!element)return false;
 element.textContent='郑州';
 element.removeAttribute?.('title');
 return false;
}
