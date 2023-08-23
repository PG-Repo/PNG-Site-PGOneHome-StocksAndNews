// $(document).ready(function(){

//     setMarqueePL();
// });
(function() {
    var nTimer = setInterval(function() {
      if (window.jQuery) {
        setMarqueePL();
        clearInterval(nTimer);
      }
    }, 100);
  })();
var timeOut=0;
function setMarqueePL(){
    if ($.fn.marquee && $("#marqueeSpan").length>0) {
        $('.marquee').marquee({
          //duration in milliseconds of the marquee
          duration: 1500*$("#marqueeSpan").attr("ScrollTime"),
          //gap in pixels between the tickers
          gap: 50,
          //time in milliseconds before the marquee will start animating
          delayBeforeStart: 0,
          //'left' or 'right'
          direction: 'left',
          //true or false - should the marquee be duplicated to show an effect of continues flow
          duplicated: false,
          pauseOnHover: true
        });
    
      } else {
        timeOut++;
        if(timeOut<=10){
          setTimeout(function () { setMarqueePL(); }, 1000);
        }
        
      }
}
