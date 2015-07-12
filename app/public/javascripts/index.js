/** Returns RGB color adequate to the number of days left to the expiration date. 
It is a linear map beetween green,yellow,red and grey, speaking in terms of days it's 10, 5, 0, -5.
For instance for day 7 it will be a color approximately in the middle of green(10) and yellow(5). 
@param {integer} numdays - days left to the expiration date
 */
var computeColor = function(numdays){
	//RGB color is stored as 3 element array, colors is an array with colors respictively green,yellow,red and grey
	var colors = [[0,227,0],[201,251,0],[127,35,35],[115,115,155]];
	//days - array which tells how each colors map between the days
	var days = [10,5,0,-5];

	//if numdays are greater or equal than 10, then it's obvious that the corresponding color is pure green
	if(numdays>=10)
		return colors[0];

	//we will iterate as long as days.length greater than 1
	while(days.length>1){//by the way loop invariant: numdays<days[0]
		//if numdays>=days[1] and from loop invariant numdays<days[0], 
		//then the corresponding color lies beetween colors[0] and colors[1] and we only need to compute the average value
		if(numdays>=days[1]){
			var days_coefficient =  (numdays-days[1])/(days[0]-days[1]);
			return [colors[1][0]+days_coefficient*(colors[0][0]-colors[1][0]),
					colors[1][1]+days_coefficient*(colors[0][1]-colors[1][1]),
					colors[1][2]+days_coefficient*(colors[0][2]-colors[1][2])];
		}
		colors.shift();
		days.shift();
	}
	//finally we conclude that numdays<day[0] = -5, so the corresponding color is pure grey (now colors[0])
	return colors[0];
}

$(document).ready(function(){
	//get rid of ugly scrolls around html tag, food panel and fridge panel
	$("html, #food-panel, #fridge-panel, #advisor").niceScroll({cursorcolor:"#FFF"}).hide();
	var datepicker = $("#datepicker").datepicker();
	datepicker.datepicker("option","dateFormat","yy-mm-dd");

	//assign appropriate color to each food tile
	$(".food-tile").each(function(){
		var days_left = $(this).data("days-left");
		var color = computeColor(days_left);
		
		var rgb = "rgb("+Math.round(color[0])+","+Math.round(color[1])+","+Math.round(color[2])+")";
		$(this).css("background-color",rgb);
		$(this).css("border","1px solid "+rgb);
	});

	$(".close-button").each(function(index){
		$(this).click(function(){
			var tile = $(this).parent();
			var item_id = tile.data("item");	
			$.ajax({url: "/content/"+item_id,type: "DELETE"});
			tile.remove();
		});
	});
});