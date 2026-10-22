const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema(
    {
        name: {type:String,required: true},
        email: {type:String,required: true,unique: true},
        password: {type:String,required: true},
        pic: {
            type:String,
            default: "https://imgs.search.brave.com/HUTVDPiT7ClCbB7RlWqD7Vk4BMYi4Z8RVOv0XWlgG_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzLzAyLzU5/LzU0LzAyNTk1NDM3/NzliMWMyZGI5YmE5/ZDYyZDQ3ZTExODgw/LmpwZw"
        },
    },{timestamp: true}
);

userSchema.methods.matchPassword = async function (eneteredPassword){
    return await bcrypt.compare(eneteredPassword,this.password);
};

userSchema.pre('save', async function (){
    if(!this.isModified('password')){
        return;
    };
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User",userSchema);
module.exports = User;