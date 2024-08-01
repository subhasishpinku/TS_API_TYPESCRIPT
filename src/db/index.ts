import { connect } from "mongoose";

const uri = 'mongodb://localhost:27017/smart-cycle-marketmo'
// const uri = 'mongodb://127.0.0.1:27017/smart-cycle-marketmo'

connect(uri).then(()=>{
      console.log('db connection Successfully')
}).catch(err => {
    console.log('db connection error:',err.message)

})