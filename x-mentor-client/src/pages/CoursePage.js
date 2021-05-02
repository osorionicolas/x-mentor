import React, { useEffect, useState, useContext } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { useParams } from "react-router-dom"
import axios from 'axios'
import { API_URL } from '../environment'
import { Grid, Typography } from '@material-ui/core'
import { useNotification } from '../hooks/notify'
import { AuthContext } from '../Providers/AuthProvider'

const styles = makeStyles(() => ({
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },
    contentContainer: {
        height: "30rem",
        textAlign: "center",
        background: "gray",
    },
    content: {
        height: "100%",
        width: "100%"
    },
    title: {
        padding: "1rem 5rem"
    },
    about: {
        padding: "2rem 5rem"
    }
}))

const CoursePage = () => {
    const classes = styles()
    const { id } = useParams()
    const notify = useNotification()
    const authContext = useContext(AuthContext)

    const [course, setCourse] = useState({})
    const [time, setTime] = useState(0)

    const fetchData = async () => {
        try{
            const response = await axios(
                `${API_URL}/courses/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${authContext.getTokens().access_token}`,
                        "Id-Token": `${authContext.getTokens().id_token}`,
                        "Content-Type": "application/json"
                    }
                }
            )
            setCourse(response.data)
        }
        catch(error){
            console.error(error)
            notify("There was an retreiving the course", "error")
        }
    }

    const Content = () => {
        if(course.content){
            if(course.content.startsWith("data:image")) return <img alt="content" className={classes.content} src={`${course.content}`}></img>
            else if(course.content.startsWith("data:video")) return <video alt="content" className={classes.content} src={`${course.content}`} controls></video>
            else return <iframe title="Content" className={classes.content} src={`${course.content}`}></iframe>
        }
        else{
            return <img alt="preview" className={classes.content} src={`${course.preview}`}></img>
        }
    }
    
    //TODO Timeseries
    const updateWatchTime = async () => {
        try{
            if(localStorage.getItem("token")){
                const response = await axios.post(
                    `${API_URL}/students/watchtime`,
                    { "date": new Date().getTime(), "time": time },
                    {
                        headers: {
                            Authorization: `Bearer ${authContext.getTokens().access_token}`,
                            "Id-Token": `${authContext.getTokens().id_token}`,
                        }
                    }
                )
                console.log(response.data)
            }
        }
        catch(error){
            console.log(error)          
        }
    }

    useEffect(() => {
        fetchData()
        setInterval(() => {
            setTime(prevTime => prevTime + 1)
        }, 1000)
        return () => {
            //updateWatchTime()
        }
    }, [])
    
    return (
        <div className={classes.root}>
            <Typography variant="h5" className={classes.title}><strong>{course.title} {time}</strong></Typography>
            <Grid container>
                <Grid item xs={2}></Grid>
                <Grid item xs={8} className={classes.contentContainer}>
                    <Content />
                </Grid>
                <Grid item xs={2}></Grid>
                <Grid item xs={2}></Grid>
                <Grid item xs={8} className={classes.about}>
                    <Typography variant="h6"><strong>About</strong></Typography>
                    <Typography>{course.description}</Typography>
                </Grid>
            </Grid>
        </div>
    )
}

export default CoursePage