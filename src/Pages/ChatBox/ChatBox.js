import React from 'react';
import { Card } from "react-bootstrap";
import ReactLoading from "react-loading";
import 'react-toastify/dist/ReactToastify.css';
import firebase from '../../Services/firebase';
import images from '../../ProjectImages/ProjectImages';
import moment from 'react-moment';
import './ChatBox.css'
import LoginString from '../Login/LoginStrings';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from '../Login/Login';
export default class ChatBox extends React.Component{
    constructor(props){
        super(props);
        this.state= {
            isLoading: false,
            isShowSticker: false,
            inputValue:""
        }
        this.currentUserName = localStorage.getItem(LoginString.Name)
        this.currentUserId = localStorage.getItem(LoginString.ID)
        this.currentUserPhoto = localStorage.getItem(LoginString.PhotoURL)
        this.currentUserDocumentId = localStorage.getItem(LoginString.FirebaseDocumentId)
        this.stateChanged = localStorage.getItem(LoginString.UPLOAD_CHANGED)
        this.currentPeerUser = this.props.currentPeerUser
        this.listMessage= []
        this.groupChatId = null;
        this.currentPeerUserMessages= [];
        this.removeListener = null
        this.currentPhotoFile = null

        firebase.firestore().collection('users').doc(this.currentPeerUser.dcoumentkey).get()
        .then((docRef)=>{
            this.currentPeerUserMessages = docRef.data().messages
        })

    }
    componentDidUpdate(){
        this.scrollToBottom()
    }
    componentWillReceiveProps(newProps){
        if(newProps.currentPeerUser){
            this.currentPeerUser = newProps.currentPeerUser
        }
    }
    componentDidMount(){
        this.getListHistory()
    }
    componentWillUnmount(){
        if(this.removeListener){
            this.removeListener()
        }
    }
    getListHistory=()=>{
        if(this.removeListener){
            this.removeListener()
        }
        this.listMessage.length =0 
        this.setState({isLoading: true})
        if(
            this.hashString(this.currentUserId) <=
            this.hashString(this.currentPeerUser.id)
        ){
            this.groupChatId = `${this.currentUserId} - ${this.currentPeerUser.id}`
        }else{
            this.groupChatId = `${this.currentPeerUser.id} - ${this.currentUserId}`
        }
        //Get history and listen new data added
        this.removeListener = firebase.firestore()
        .collection('messages')
        .doc(this.groupChatId)
        .collection(this.groupChatId)
        .onSnapshot(snapshot =>{
            snapshot.docChanges().forEach(change =>{
                if(change.type === LoginString.DOC){
                    this.listMessage.push(change.doc.data())
                }
            })
            this.setState({isLoading: false})
        },
        err =>{
            this.props.showToast(0, err.toString())
        })
    }
    onSendMessage=(content, type)=>{
        let notificationMessages=[]
        if(this.state.isShowSticker && type ===2){
            this.setState({isShowSticker: false})
        }
        if(content.trim() === ''){
            return
        }
        const timestamp = moment()
        .valueOf()
        .toString()

        const itemMessage = {
            idFrom: this.currentUserId,
            idTo: this.currentPeerUser.id,
            timestamp: timestamp,
            content: content.trim(),
            type: type
        }
        firebase.firestore()
        .collection('messages')
        .doc(this.groupChatId)
        .collection(this.groupChatId)
        .doc(timestamp)
        .set(itemMessage)
        .then(()=>{
            this.setState({inputValue: ''})
        })
        this.currentPeerUserMessages.map((item)=>{
            if(item.notificationId != this.currentUserId){
                notificationMessages.push({
                    notificationId: item.notificationId,
                    number: item.number
                })
            }
        })
        firebase.firestore()
        .collection('users')
        .doc(this.currentPeerUser.dcoumentkey)
        .update({
            messages: notificationMessages
        })
        .then((data)=>{})
        .catch(err=> {
            this.props.showToast(0, err.toString)
        })
    }
    scrollToBottom=()=>{
        if(this.messagesEnd){
            this.messagesEnd.scrollIntoView({})
        }
    }
    onKeyboardPress = event =>{
        if(event.key === 'Enter'){
            this.onSendMessage(this.state.inputValue, 0)
        }
    }
    openListSticker=()=>{
        this.setState({isShowSticker: !this.state.isShowSticker})
    }
    render(){
        return(
           <Card className = "viewChatBoard">
               <div className="headerChatBoard">
                   <img
                   className="viewAvatarItem"
                   src= {this.currentPeerUser.PhotoURL}
                   alt=""
                   />
                   <span className="textHeaderChatBoard">
                       <p style={{fontsize:'20px'}}>{this.currentPeerUser.name}</p>
                   </span>
                   <div className="about me">
                   <span >
                       <p >{this.currentPeerUser.description}</p>
                   </span>
                   </div>
               </div>
               <div className="viewListContentChat">
                   {this.renderListMessage()}
                   <div
                   style={{float:'left', clear:'both'}}
                   ref={el => {
                       this.messagesEnd = el
                   }}
                   />
               </div>
               {this.state.isShowSticker ? this.renderSticker() : null}
               <div className="viewBottom">
                   <img
                   className="isOpenGallery"
                   src={images.photoicon}
                   alt="photoicon"
                   onClick={()=>{this.refInput.click()}}
                   />
                   <img
                   className="viewInputGallery"
                   accept="images/"
                   type="file"
                   onChange={this.onChoosePhoto}
                   />
                   <img
                   className="isOpenSticker"
                   src={images.tag}
                   accept="icon open stciker"
                   onChange={this.openListSticker}
                   />
                   <input 
                   className="viewInput"
                   placeholder="Type a message"
                   value={this.state.inputValue}
                   onChange={event =>{
                       this.setState({inputValue: event.target.value})
                   }}
                   onKeyPress = {this.onKeyPress}
                   />
                   <img
                   className="icSend"
                   src={images.send}
                   alt="icon send"
                   onClick={()=> {this.onSendMessage(this.state.inputValue, 0)}}
                   />

               </div>
               {this.state.isLoading ? (
                   <div className="viewLoading">
                       <ReactLoading
                       type={'spin'}
                       color={'Blue'}
                       height={'3%'}
                       width={'3%'}
                       />

                   </div>
               ): null
               }
           </Card>
        )
    }
    renderListMessage= () =>{
        if(this.listMessage.length > 0){
            let viewListMessage = []
            this.listMessage.forEach((item, index)=>{
                if(item.idFrom === this.currentUserId){
                    if(item.type === 0){
                        viewListMessage.push(
                            <div className="viewItemRight" key={item.timestamp}>
                                <span className="textContentItem">{item.content}</span>
                            </div>
                        )
                    }else if(item.type === 1){
                        viewListMessage.push(
                            <div 
                            className="viewItemRight2" key={item.timestamp}>
                                <img
                                className = "imgItemRight"
                                src={item.content}
                                alt="Please updateyour image"
                                />
                            </div>
                        )
                    }else{
                        viewListMessage.push(
                            <div className="viewItemRight3" key={item.timestamp}>
                                <img
                                className="imgItemRight"
                                src={this.getGifImage(item.content)}
                                alt="content message"
                                />
                            </div>
                        )
                    }
                }else{
                        if(item.type===0){
                            viewListMessage.push(
                                <div className="viewWrapItemLeft" key={item.timestamp}>
                                    <div className="viewWrapItemLeft3">
                                        {this.isLastMessageLeft(index) ? (
                                            <img
                                            className="peerAvatarLeft"
                                            src={this.currentPeerUser.URL}
                                            alt=""
                                            />
                                        ): (
                                            <div className="viewPaddingLeft"/>
                                        )}
                                        <div className="viewItemLeft">
                                            <span className="textContentItem">{item.content}</span>
                                        </div>
                                    </div>
                                    {this.isLastMessageLeft(index)?(
                                        <span className="textTimeLeft">
                                            <div>
                                                {moment(Number(item.timestamp)).format('11')}
                                            </div>
                                        </span>
                                    ): null}
                                </div>
                            )
                        }else if(item.type === 1){
                            viewListMessage.push(
                                <div className="viewWrapItemLeft2" key={item.timestamp}>
                                    <div className="viewWrapItemLeft3">
                                        {this.isLastMessageLeft(index) ? (
                                            <img
                                            className="peerAvatarLeft"
                                            src={this.currentPeerUser.URL}
                                            alt="avatar"
                                            />
                                        ): (
                                            <div className="viewPaddingLeft"/>
                                        )}
                                        <div className="viewItemLeft2">
                                            <img 
                                            src={item.content}
                                            alt="conetnt message"
                                            className="imgItemLeft"
                                            />
                                        </div>
                                    </div>
                                    {this.isLastMessageLeft(index)?(
                                        <span className="textTimeLeft">
                                            <div>
                                                {moment(Number(item.timestamp)).format('11')}
                                            </div>
                                        </span>
                                    ): null}
                                </div>
                            )
                        }else{
                            viewListMessage.push(
                                <div className="viewWrapItemLeft2" key={item.timestamp}>
                                <div className="viewWrapItemLeft3">
                                    {this.isLastMessageLeft(index) ? (
                                        <img
                                        className="peerAvatarLeft"
                                        src={this.currentPeerUser.URL}
                                        alt="avatar"
                                        />
                                    ): (
                                        <div className="viewPaddingLeft"/>
                                    )}
                                    <div className="viewItemLeft3" key={item.timestamp}> 
                                            <img
                                        className="imgItemRight"
                                        src={this.getGifImage(item.content)}
                                        alt="content message"
                                        />
                                    </div>
                                </div>
                                {this.isLastMessageLeft(index)?(
                                        <span className="textTimeLeft">
                                            <div>
                                                {moment(Number(item.timestamp)).format('11')}
                                            </div>
                                        </span>
                                    ): null}
                            </div>
                            )
                        }
                    }
                
            })
            return viewListMessage
        }else{
            return(
                <div className="viewWrapSayHi">
                    <span className="textSayHi">Say hi to new friend</span>
                    <img
                    className="imgWaveHand"
                    src={images.lego1}
                    alt="wave hand"
                    />
                </div>
            )
        }
    }
    renderStickers=()=>{
        return(
            <div className ='viewStcikers'>
                <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
                 <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
                 <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
                 <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
                 <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
                 <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
                 <img
                className="imgSticker"
                src={images.lego1}
                alt="sticker"
                onClick={()=>{this.onSendMessage('lego1', 2)}}
                />
            </div>
        )
    }
    getGifImage= value => {
        switch(value){
            case 'lego1':
                return images.lego1
            default:
                return null
        }
    }
    hashString = str => {
        let hash = 0 
        for(let i =0; i< str.length; i++){
            hash += Math.pow(str.charCodeAt(i) * 31, str.length - i)
            hash = hash & hash 
        }
        return hash
    }
    isLastMessageLeft(index){
        if(
            (index +1 < this.listMessage.length &&
                this.listMessage[index+1].idFrom === this.currentUserId) ||
                index=== this.listMessage.length -1 
        ){
            return true
        }else{
            return false
        }
    }
    isLastMessageRight(index){
        if(
            (index +1 < this.listMessage.length &&
                this.listMessage[index+1].idFrom !== this.currentUserId) ||
                index=== this.listMessage.length -1 
        ){
            return true
        }else{
            return false
        }
    }
}