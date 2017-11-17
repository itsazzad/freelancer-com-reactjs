import React, {Component} from 'react';
import {
    BrowserRouter as Router,
    Route,
    Link
} from 'react-router-dom';
import axios from 'axios';
import './App.css';

class App extends Component {
    render() {
        return (
            <Router>
                <div>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/projects">Projects</Link></li>
                        <li><Link to="/contests">Contests</Link></li>
                    </ul>

                    <hr/>

                    <Route exact path="/" component={Home}/>
                    <Route path="/projects" component={Projects}/>
                    <Route path="/contests" component={Contests}/>
                </div>
            </Router>
        );
    }
}

class Home extends Component {
    render() {
        return (
            <div>
                <h2>Home</h2>
            </div>
        );
    }
}

class Projects extends Component {
    constructor(props) {
        super(props);
        this.state = {
            projects: []
        };
    }

    componentDidMount() {
        axios.get('https://www.freelancer.com/api/projects/0.1/projects/active')
            .then(function (response) {
                console.log(response);
                this.setState(
                    {projects: response.result.projects}
                );
            })
            .catch(function (error) {
                console.error(error);
            });
    }

    render() {
        return (
            <div>
                <h2>Projects</h2>
            </div>
        );
    }
}

class Contests extends Component {
    constructor(props) {
        super(props);
        this.state = {
            contests: []
        };
    }

    componentDidMount() {
        axios.get('https://www.freelancer.com/api/contests/0.1/contests/?statuses[]=active')
            .then(function (response) {
                console.log(response);
                this.setState(
                    {contests: response.result.contests}
                );
            })
            .catch(function (error) {
                console.error(error);
            });
    }

    render() {
        return (
            <div>
                <h2>Contests</h2>
            </div>
        );
    }
}


export default App;
