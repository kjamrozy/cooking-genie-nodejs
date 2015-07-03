$(document).ready(function(){
	//get rid of ugly scrolls around html tag, food panel and fridge panel
	$("html, #food-panel, #fridge-panel, #advisor").niceScroll({cursorcolor:"#FFF"}).hide();
	var datepicker = $("#datepicker").datepicker();
	datepicker.datepicker("option","dateFormat","yy-mm-dd");
});