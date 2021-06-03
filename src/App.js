import React, { useState, useRef, useEffect} from "react"
import Form from "./components/UsernameForm.jsx"
import Chat from "./components/Chat"
import io from "socket.io-client"
import immer from "immer"

import './App.css';

const initialMessagesState = {
  genral: [],
  random:[],
  jokes: [],
  javascript: []
}

function App() {
  const [username, setUsername] = useState("")
  const [connected, setConnected] = useState(false)
  const [currentchat, setCurrentchat] = useState({isChannel: true, chatName: "general", recieverId:""})
  const [connectedrooms, setConnectedrooms] = useState("general")
  const [alluser, setAlluser] = useState([])
  const [messages, setMessages] = useState(initialMessagesState)
  const [message, setMessage] = useState("")
  const socketRef = useRef() 

  useEffect(()=>{
    setMessages("")
  }, [messages])

  function connect(){
    setConnected(true)
    socketRef.current =io.connect("http://localhost:3000")
    socketRef.current.emit("join server", username)
    socketRef.current.emit("join room", "general", (message)=> roomjoinCallBack(messages, "general"))
    socketRef.current.on("new user", alluser=>{
      setAlluser(alluser)
    })

    socketRef.current.on("new message", ({content, sender, chatName})=>{
      setMessages(messages=>{
        const newMessages = immer(messages, draft =>{
          if (draft){
            draft[chatName].push({content, sender})
          }
          else {
            draft[chatName] = [{content, sender}]
          }
        })
        return newMessages
      })
    })
  }

  function handleMessageChange(e){
    setMessage(e.current.target.value)
  }

  function handleChange(e){
    setUsername(e.target.value)
  }

  function sendmesssage(){
    const payload = {
      content: message,
      to: currentchat.isChannel ? currentchat.chatName : currentchat.recieverId,
      chatName: currentchat.chatName,
      isChannel: currentchat.isChannel
    }
    socketRef.current.emit("send message", payload)
    const newMessage = immer(message, draft=>{
      draft[currentchat.chatName].push({
        sender: username,
        content: message
      })
    })
    setMessage(newMessage)
  }

  function roomjoinCallBack(incomingMessages, room) {
    const newMessages = immer(messages, draft=>{
      draft[room] = incomingMessages
    } )
     setMessages(newMessages)
  }

   function joinroom(room){
     const newConnected = immer(connectedrooms, draft=>{
       draft.push(room)
     })
     socketRef.current.emit("join room", room , (messages)=>
       roomjoinCallBack(messages, room))
       setConnectedrooms(newConnected)
   }

   function toggleChat(currentchat){
    if (!messages[currentchat.chatName]){
      const newMessages = immer(messages, draft =>{
        draft[currentchat.chatName] =[]

      })
      setCurrentchat(currentchat)
    }
   }
  
  let body; 
  if (connected){
    body = (
      <Chat 
      message={message}
      handleMessageChange={handleMessageChange}
      sendmesssage ={sendmesssage}
      yourId={socketRef.current ? socketRef.current.id : ""}
      alluser={alluser}
      joinroom={joinroom}
      connectedrooms= {connectedrooms}
      currentchat={currentchat}
      toggleChat={toggleChat}
      messages={messages[currentchat.chatName]}
      />
    );
  }
    else {
      body = (
        <Form username={username} onChange={handleChange} connect={connect}/>
      )

    }
  

  return (
    <div className="App">
     {body}
    </div>
  );
}

export default App;
