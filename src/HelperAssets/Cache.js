function setLocalStorage1(key, value, ttl){
    console.log("setting local storage for "+key);
    var currentTime = new Date();
    var expiryTime = currentTime.setMinutes(currentTime.getMinutes() + ttl);
    const item = {
      value: value,
      expiry: expiryTime,
      currentUser:this.props.pgContext.user.email
    }
    localStorage.setItem(key, JSON.stringify(item))
  }
  function getLocalStorage1(key) {
   
    const itemStr = localStorage.getItem(key)
    // if the item doesn't exist, return null
    if (!itemStr) {
      return null
    }
    const item = JSON.parse(itemStr)
    var  now = new Date()
    var itemExpiry=new Date(item.expiry)
    // compare the expiry time of the item with the current time
    if (this.props.pgContext.user.email == item.currentUser && now < itemExpiry) {    
      return item.value
    }else{
      localStorage.removeItem(key)
    }
   
  }