import React, { Component } from 'react';
import spinner from './spinner.png';
import './App.css';

import { withAuthenticator } from 'aws-amplify-react'
import { Storage, API, graphqlOperation } from 'aws-amplify'

function getRandomInt() {
  return Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
}

const Query = `
  query($imageName: String!, $type: String) {
    process(imageName: $imageName, type: $type) {
      results
    }
  }
`

class App extends Component {
  state = {
    imageName: '', imageInfo: '', imageUrl: '', processing: false, rekognitionData: [],
    isSnapped: false, showCamera: false, streamHeight: 0, streamWidth: 0,
    labelData: []
  }
  componentDidMount() {
    var video = document.getElementById('video');
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          let height = stream.getVideoTracks()[0].getSettings().height
          let width = stream.getVideoTracks()[0].getSettings().width
          if (width > 1000) {
            height = height / 2
            width = width / 2
          }
          this.setState({
            streamWidth: width,
            streamHeight: height
          })
          // https://stackoverflow.com/questions/53626318/chrome-update-failed-to-execute-createobjecturl-on-url/53734174
          try {
            video.src = window.URL.createObjectURL(stream);
          } catch (error) {
            video.srcObject = stream;
          }
          video.play();
      });
    }
  }
  toggleCamera = () => {
    this.setState({
      showCamera: !this.state.showCamera,
      rekognitionData: [],
      labelData: []
    })
  }
  takePicture = () => { 
    this.setState({
      isSnapped: true, rekognitionData: []
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
    var file = new Blob([new Uint8Array(array)], {type: 'image/png'});

    const fileName = getRandomInt() + 'user_picture.png'
    Storage.put(fileName, file)
      .then(res => {
        const imageInfo = { imageName: fileName }
        API.graphql(graphqlOperation(Query, imageInfo))
          .then(data => {
            console.log('data:', data)
            const parsedData = JSON.parse(data.data.process.results)
            this.setState({
              processing: false,
              rekognitionData: parsedData.FaceDetails
            })
        })
        .catch(error => {
          console.log('error: ', error)
          this.setState({
            processing: false,
          })
        })
      })
      .catch(err => {
        console.log('error from upload: ', err)
        this.setState({
          processing: false,
        })
      })
  }
  onChange = e => {
    console.log('e: ', e)
    const file = e.target.files[0];
    console.log('file: ', file)
    if (!file) return
    this.setState({
      rekognitionData: [],
      labelData: [],
      imageInfo: file,
      imageName: getRandomInt() + file.name,
      imageUrl: URL.createObjectURL(file),
      showCamera: false,
      isSnapped: false
    })
  }
  saveFile = (labels) => {
    if (this.state.imageName === '') return
    this.setState({ processing: true })
    Storage.put(this.state.imageName, this.state.imageInfo)
    .then (result => {
      const image = {
        imageName: this.state.imageName
      }
      if (labels) {
        image.type = 'labels'
      }
      API.graphql(graphqlOperation(Query, image))
        .then(data => {
          const parsedData = JSON.parse(data.data.process.results)
          if (parsedData.FaceDetails) {
            this.setState({
              processing: false,
              rekognitionData: parsedData.FaceDetails
            })
          }
          if (parsedData.Labels) {
            this.setState({
              processing: false,
              labelData: parsedData.Labels
            })
          }
         
        })
        .catch(error => {
          this.setState({
            processing: false,
          })
          console.log('error: ', error)
        })
    })
    .catch(err => console.log(err));
  }
  
  render() {
    console.log('state:' , this.state)
    return (
      <div className="App">
        <div style={styles.header}>
          <p style={styles.heading}>GraphQL Rekognizr</p>
        </div>
        <p style={styles.title}>
          Choose your picture to be rekognized
        </p>
        <p>Be sure your picture includes at least one face.</p>
        <input onChange={this.onChange} type="file" name="file" id="file" className="inputfile" />
        <label htmlFor="file">Choose a file</label>

        <p className="camerabutton" onClick={this.toggleCamera}>Toggle Camera</p>
        <br />
        {
          !this.state.showCamera && <img src={this.state.imageUrl} style={{ height: 500, padding: '30px 0px' }} />
        }
        <br />
        {
         !this.state.showCamera && this.state.imageName !== '' && <button onClick={this.saveFile} style={styles.button}>Recognize People</button>
        }
        {
         !this.state.showCamera && this.state.imageName !== '' && <button onClick={() => this.saveFile ('labels')} style={styles.button}>Recognize Labels</button>
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
          !!this.state.rekognitionData.length && <h2 style={{ backgroundColor: '#463744', color:'white', margin: '10px 0px',
          width: 230,
          margin: '20px auto 0px',
          padding: '10px 0px',
          
        }}>Number of People: {this.state.rekognitionData.length}</h2>
        }
        {
          this.state.rekognitionData.map((d, i)=> (
            <div key={i} style={{
              padding: '0px 0px 10px', borderBottomWidth: 1, borderBottomColor: '#ddd',
            }}>
              <h2 style={{ margin: '10px 0px' }}>Person { i + 1 }</h2>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <p style={styles.characteristic}>Age Estimate: { (d.AgeRange.High + d.AgeRange.Low) / 2 }</p>
                <p style={styles.characteristic}>Gender: { d.Gender.Value }</p>
                <p style={{...styles.characteristic, ...styles.lastCharacteristic}}>Smiling:  { d.Smile.Value ? 'Yes' : 'No' }</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <p style={styles.characteristic}>Beard: { d.Beard.Value ? 'Yes' : 'No' }</p>
                <p style={styles.characteristic}>Mustache: { d.Mustache.Value ? 'Yes' : 'No' }</p>
                <p style={{...styles.characteristic, ...styles.lastCharacteristic}}>Glasses: { d.Eyeglasses.Value ? 'Yes' : 'No' }</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <p style={styles.characteristic}>Eyes Open: { d.EyesOpen.Value ? 'Yes' : 'No' }</p>
                <p style={{...styles.characteristic, ...styles.lastCharacteristic}}>Mouth Open: { d.MouthOpen.Value ? 'Yes' : 'No' }</p>
              </div>
              <h3>Emotions</h3>
              {
                d.Emotions.map((e, ei) => {
                  if (ei < 2) return <p key={ei}>{e.Type}</p>
                })
              }
            </div>
          ))
        }
        {
          this.state.labelData.map((d, i)=> (
            <div key={i} style={{
              padding: '0px 0px 10px', borderBottomWidth: 1, borderBottomColor: '#ddd',
            }}>
              <h2 style={{ margin: '10px 0px' }}>Prediction: {d.Name}</h2>
              <p style={styles.characteristic}>Confidence: { (d.Confidence) }</p>
            </div>
          ))
        }
      </div>
    );
  }
}

const styles = {
  characteristic: {
    margin: '15px 10px 0px 0px',
    borderRight: '1px solid #ddd',
    paddingRight: 15,
    fontSize: 18
  },
  lastCharacteristic: {
    borderRight: 'none'
  },
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
    fontSize: 28,
    margin: '10px 0px'
  },
  header: {
    height: 100,
    backgroundColor: '#463744',
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
