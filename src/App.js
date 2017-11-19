import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Route,
    Link
} from 'react-router-dom';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import './App.css';

const LIMIT = 10;
const MINIMUM_AGE = 30 * 60;

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

class Projects extends Component {
    constructor(props) {
        super(props);
        this.invalidEntries = 0;
        this.state = {
            projects: [],
            offset: 0
        };
    }

    isMaturedEnough = (project) => {
        return project.submitdate < (Date.now() - MINIMUM_AGE);
    };

    filterByCriteria = (project) => {
        if (this.isMaturedEnough(project)) {
            return true;
        }
        this.invalidEntries++;
        return false;
    };

    loadProjectsFromServer() {
        const url = `https://www.freelancer.com/api/projects/0.1/projects/active?include_contests=true&compact=true&limit=${LIMIT}&offset=${this.state.offset}`;
        axios.get(url)
            .then((response) => {
                const data = response.data;
                if (data.status === 'success') {
                    const projects = data.result.projects.filter(this.filterByCriteria);
                    const pageCount = Math.ceil(data.result.total_count / LIMIT);
                    this.setState({
                        projects,
                        pageCount
                    });
                } else {
                    console.error(data.status);
                }
            })
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
                    <td><a href={`https://www.freelancer.com/projects/`}>{jobNode.title}</a></td>
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
                        <h1>Dashboard</h1>
                        <div className="table-responsive">

                            <table className="table table-striped">
                                <thead>
                                <tr>
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
