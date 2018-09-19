import React, { Component } from 'react';
import spinner from './spinner.png';
import './App.css';

import { withAuthenticator } from 'aws-amplify-react'
import { Storage, API, graphqlOperation } from 'aws-amplify'

function getRandomInt() {
  return Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
}

const Query = `
  query($imageInfo: String!) {
    fetchImage(imageInfo: $imageInfo) {
      data
    }
  }
`

class App extends Component {
  state = {
    imageName: '', imageInfo: '', imageUrl: '', processing: false, rekognitionData: [],
    isSnapped: false, showCamera: false, streamHeight: 0, streamWidth: 0
  }
  componentDidMount() {
    var video = document.getElementById('video');
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          const height = stream.getVideoTracks()[0].getSettings().height
          const width = stream.getVideoTracks()[0].getSettings().width
          this.setState({
            streamWidth: width,
            streamHeight: height
          })
          video.src = window.URL.createObjectURL(stream);
          video.play();
      });
    }
  }
  toggleCamera = () => {
    this.setState({
      showCamera: !this.state.showCamera,
      rekognitionData: []
    })
  }
  takePicture = () => { 
    this.setState({
      isSnapped: true
    })
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var video = document.getElementById('video');
    
    context.drawImage(video, 0, 0, this.state.streamWidth, this.state.streamHeight);

    this.saveImageFromCanvas()
  }
  saveImageFromCanvas = () => {
    this.setState({ processing: true })
    var image = new Image()
    image.id = "pic" + getRandomInt()
    var canvas = document.getElementById("canvas");
    image.src = canvas.toDataURL();

    var blobBin = atob(image.src.split(',')[1]);
    var array = [];
    for(var i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
    }
    var file=new Blob([new Uint8Array(array)], {type: 'image/png'});

    const fileName = getRandomInt() + 'user_picture.png'
    Storage.put(fileName, file, {
      contentType: 'image/png'
    })
      .then(res => {
        const imageInfo = { imageInfo: fileName }
        API.graphql(graphqlOperation(Query, imageInfo))
        .then(data => {
          const parsedData = JSON.parse(data.data.fetchImage.data)
          this.setState({
            processing: false,
            rekognitionData: parsedData.FaceDetails
          })
        })
        .catch(error => {
          console.log('error: ', error)
        })
      })
      .catch(err => console.log('error from upload: ', err))
  }
  onChange = e => {
    console.log('e: ', e)
    const file = e.target.files[0];
    console.log('file: ', file)
    this.setState({
      rekognitionData: [],
      imageInfo: file,
      imageName: getRandomInt() + file.name,
      imageUrl: URL.createObjectURL(file),
      showCamera: false,
      isSnapped: false
    })
  }
  saveFile = () => {
    console.log('state: ', this.state)
    if (this.state.imageName === '') return
    console.log('state: ', this.state)
    this.setState({ processing: true })
    Storage.put(this.state.imageName, this.state.imageInfo, {
      contentType: 'image/png'
    })
    .then (result => {
      console.log('result: ', result)
      const image = {
        imageInfo: this.state.imageName
      }
      API.graphql(graphqlOperation(Query, image))
        .then(data => {
          const parsedData = JSON.parse(data.data.fetchImage.data)
          console.log('FaceDetails:', parsedData.FaceDetails)
          this.setState({
            processing: false,
            rekognitionData: parsedData.FaceDetails
          })
        })
        .catch(error => {
          console.log('error: ', error)
        })
    })
    .catch(err => console.log(err));
  }
  
  render() {
    return (
      <div className="App">
        <div style={styles.header}>
          <p style={styles.heading}>GraphQL Rekognizr</p>
        </div>
        <p style={styles.title}>
          Upload your picture to be rekognized
        </p>
        <input onChange={this.onChange} type="file" name="file" id="file" className="inputfile" />
        <label htmlFor="file">Choose a file</label>

        <p className="camerabutton" onClick={this.toggleCamera}>Toggle Camera</p>
        <br />
        {
          !this.state.showCamera && <img src={this.state.imageUrl} style={{ height: 500, padding: '30px 0px' }} />
        }
        <br />
        {
         !this.state.showCamera && this.state.imageName !== '' && <button onClick={this.saveFile} style={styles.button}>Get Image Info</button>
        }
        {
          this.state.processing && !this.state.showCamera && <div><br /><img src={spinner} className='spinner' /></div>
        }
        <div>
          <video
            style={{
              height: this.state.isSnapped || !this.state.showCamera ? '0px' : this.state.streamHeight
            }}
          id="video" width={this.state.streamWidth} height={this.state.streamHeight} autoPlay></video>
          <br />
          <canvas style={{
            marginTop: -24,
            height: !this.state.isSnapped || !this.state.showCamera ? '0px' : this.state.streamHeight
          }} id="canvas" width={this.state.streamWidth} height={this.state.streamHeight}></canvas>
        </div>
        <br />
        {
          this.state.processing && this.state.showCamera && <div><br /><img src={spinner} className='spinner' /></div>
        }
        {
          this.state.isSnapped && !this.state.processing && this.state.showCamera && <button style={styles.button} id="snap" onClick={() => {
            this.setState({ isSnapped: false, rekognitionData: [] })
          }}>Take Another Photo</button>
        }
        {
          this.state.showCamera && !this.state.processing && <button style={styles.button} id="snap" onClick={this.takePicture}>Snap Photo</button>
        }
        <br /> 
        {
          this.state.rekognitionData.map((d, i)=> (
            <div key={i} style={{ padding: '10px 0px', borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
              <h1>Person { i + 1 }</h1>
              <p>Age Estimate: { (d.AgeRange.High + d.AgeRange.Low) / 2 }</p>
              <p>Gender: { d.Gender.Value }</p>
              <p>Smiling?  { d.Smile.Value ? 'Yes' : 'No' }</p>
              <p>Beard ? : { d.Beard.Value ? 'Yes' : 'No' }</p>
              <p>Mustache ? : { d.Mustache.Value ? 'Yes' : 'No' }</p>
              <p>Glasses ? : { d.Eyeglasses.Value ? 'Yes' : 'No' }</p>
              <p>Eyes Open ? : { d.EyesOpen.Value ? 'Yes' : 'No' }</p>
              <p>Mouth Open ? : { d.MouthOpen.Value ? 'Yes' : 'No' }</p>
              <h3>Emotions</h3>
              {
                d.Emotions.map((e, ei) => <p key={ei}>{e.Type}</p>)
              }
            </div>
          ))
        }
      </div>
    );
  }
}

const styles = {
  button: {
    padding: '14px 50px',
    border: 'none',
    outline: 'none',
    backgroundColor: '#ddd',
    cursor: 'pointer',
    fontSize: 20,
    margin: '0px 5px'
  },
  input: {
    width: 0.1,
    height: 0.1,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    zIndex: -1
  },
  title: {
    fontSize: 28
  },
  header: {
    height: 100,
    backgroundColor: '#2962FF',
    display: 'flex',
    alignItems: 'center'
  },
  heading: {
    color: 'white',
    fontSize: 40,
    paddingLeft: 100
  }
}

export default withAuthenticator(App, { includeGreetings: true });
