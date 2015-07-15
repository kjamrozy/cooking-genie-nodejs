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
		$(this).find(".close-button").css("background-color",rgb);
		$(this).find(".title-bar").css("background-color",rgb);
	});

	$(".close-button").each(function(index){
		$(this).click(function(){
			//get whole tile object
			var tile = $(this).parent().parent();

			//read referenced product id and make ajax call for deleting it
			var item_id = tile.data("item");	
			$.ajax({url: "/content/"+item_id,type: "DELETE"});
			//remove tile from web browser
			tile.remove();
		});
	});
	//init progress bar 
	$("#progress").progressbar({value: false});

	$("#advisor-button").click(function(){
		//hide advisor prompt and button
		$("#advisor-prompt").hide();

		//show progress bar and its caption
		$("#progress").removeClass("hide");
		$("#progress_caption").removeClass("hide");

		//get array of cookable products
		$.getJSON('/advise',function(data){
			//hide advisor jumbotron
			$("#advisor").hide();

			//show proposition panel
			$('#proposition').removeClass("hide");

			//if there isn't any cookable product then inform about that
			if(data.length==0)
				return $("#panel-prop").html("<center><p>There nothing that you can cook! You'd better go shoping.</p></center>");

			var it=0;//current displayed product

			//auxiliary function for dynamic replacing proposed product
			var showProduct = function(){
				$('#img').attr('src',data[it].img_url);
				$('#title').text(data[it].name);
				$('#calories').html("Calories: "+data[it].calories);
				$('#quantity').html("Quantity: "+data[it].quantity+data[it].quantity_magnitude);
				$('#description').html(data[it].description);
			};
			//now show 1st proposed product
			showProduct();
			//by default hide all arrows
			$("#arrow-right").hide();
			$("#arrow-left").hide();

			if(data.length>1)
				$("#arrow-right").show();

			$("#arrow-left").click(function(){
				it--;//move pointer to the left product
				$("#arrow-right").show();//show right arrow since we've just moved here from that one
				if(it==0) $("#arrow-left").hide();//hide left arrow it we're at the very 1st product
				showProduct();//replace product info in the panel
			});

			//same idea like before
			$("#arrow-right").click(function(){
				it++;
				$("#arrow-left").show();
				if(it==data.length-1) $("#arrow-right").hide();
				showProduct();
			});
		});
		});
});