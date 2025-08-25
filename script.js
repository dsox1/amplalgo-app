
function Get_KuCoinPrice(market)
{
// example HST-BTC
var url = "https://api.kucoin.com/v1/open/tick?symbol="+market;
var response = UrlFetchApp.fetch(url);
var text = response.getContentText();
var myjson = JSON.parse(text);
var price = myjson.data.lastDealPrice;
return price;
}





function Get_KuCoinPrice(market)
{
// example HST-BTC
var url = "https://api.kucoin.com/v1/open/tick?symbol="+market;
var response = UrlFetchApp.fetch(url);
var text = response.getContentText();
var myjson = JSON.parse(text);
var price = myjson.data.price;
return price;
}
