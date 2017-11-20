import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Route,
    Link
} from 'react-router-dom';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import merge from 'deepmerge';
import './App.css';

const LIMIT = 1;
const MINIMUM_AGE = 24 * 60 * 60 / 50;
const COUNTRIES = [
    'no',
    'lu',
    'li',
    'qa',
];

class App extends Component {
    render() {
        return (
            <Router>
                <header>
                    <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
                        <div className="collapse navbar-collapse" id="navbarsExampleDefault">
                            <ul className="navbar-nav mr-auto">
                                <li className="nav-item">
                                    <Link to="/" className="nav-link">Home</Link>
                                </li>
                            </ul>
                            <Route exact path="/" component={Projects}/>
                        </div>
                    </nav>
                </header>
            </Router>
        );
    }
}

class Filter {
    constructor(projects) {
        this.projects = projects;
        this.invalidEntries = 0;
        this.projects = projects.filter((project) => {
            return this.start(project);
        });
    }

    static isMaturedEnough(project) {
        console.error(project.submitdate, parseInt(Date.now() / 1000, 0), parseInt(Date.now() / 1000 - MINIMUM_AGE, 0));
        return true;
        return (project.submitdate < parseInt(Date.now() / 1000 - MINIMUM_AGE, 0));
    }

    start(project) {
        if (!this.constructor.isMaturedEnough(project)) {
            this.invalidEntries++;
            return false;
        }
        return true;
    }
}

class Request {
    static projects(url) {
        return axios.get(url);
    }

    static projectsInReverseOrder(url) {
        return axios.get(url + 'reverse_sort=true&');
    }
}

class Projects extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: {},
            projects: [],
            offset: 0,
        };
    }

    loadProjectsFromServer() {
        let url = `https://www.freelancer.com/api/projects/0.1/projects/active?`;
        url += `include_contests=true&`;
        url += `compact=true&`;
        url += `user_details=true&`;
        url += `limit=${LIMIT}&`;
        url += `offset=${this.state.offset}&`;
        for (let country of COUNTRIES) {
            url += `countries[]=${country}&`;
        }

        axios.all([Request.projects(url), Request.projectsInReverseOrder(url)])
            .then(axios.spread((projectsInOrder, projectsInReverseOrder) => {
                const projectsData = merge(projectsInOrder, projectsInReverseOrder);
                if (projectsData.status === 200) {
                    let projects = projectsData.data;
                    const pageCount = Math.ceil(projects.result.total_count / LIMIT);
                    console.error(projects.result.projects);
                    projects = new Filter(projects.result.projects);
                    console.error('invalidEntries: ', projects.invalidEntries);
                    projects = projects.projects;
                    this.setState({
                        projects,
                        pageCount,
                    });
                } else {
                    console.error(projectsData.status);
                }
            }))
            .catch((error) => {
                console.error(error);
            });
    }

    componentDidMount() {
        this.loadProjectsFromServer();
    }

    handlePageClick = (data) => {
        let selected = data.selected;
        let offset = Math.ceil(selected * LIMIT);

        this.setState({ offset: offset }, () => {
            this.loadProjectsFromServer();
        });
    };

    render() {
        let jobList = this.state.projects.map(function (jobNode, index) {
            return (
                <tr key={jobNode.id}>
                    <td>{index + 1}</td>
                    <td><a href={`https://www.freelancer.com/projects/${jobNode.seo_url}`}>{jobNode.title}</a></td>
                    <td>{jobNode.bid_stats.bid_count}/{jobNode.bid_stats.bid_avg}</td>
                    <td>{jobNode.submitdate}</td>
                    <td>{jobNode.currency.code} {jobNode.budget.minimum} - {jobNode.budget.maximum}</td>
                </tr>
            );
        });
        return (
            <div className="container-fluid">
                <div className="row">
                    <main role="main" className="col-sm-12 ml-sm-auto col-md-12 pt-3">
                        <h1>Dashboard
                            <small>Filtered out</small>
                        </h1>
                        <div className="table-responsive">

                            <table className="table table-striped">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>PROJECT/CONTEST</th>
                                    <th>BIDS/ENTRIES</th>
                                    <th>STARTED</th>
                                    <th>PRICE</th>
                                </tr>
                                </thead>
                                <tbody>
                                {jobList}
                                </tbody>
                            </table>
                        </div>
                    </main>
                </div>
                <div className="row">
                    <ReactPaginate previousLabel={"previous"}
                                   nextLabel={"next"}
                                   breakLabel={<a href="">...</a>}
                                   breakClassName={"break-me"}
                                   pageCount={this.state.pageCount}
                                   marginPagesDisplayed={2}
                                   pageRangeDisplayed={5}
                                   onPageChange={this.handlePageClick}
                                   containerClassName={"pagination"}
                                   subContainerClassName={"pages pagination"}
                                   activeClassName={"active"}/>

                </div>
            </div>
        );
    }
}

export default App;
