import React, {Component} from 'react';
import {
    BrowserRouter as Router,
    Route,
    Link
} from 'react-router-dom';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import merge from 'deepmerge';
import Select from 'react-select';
import './App.css';
import 'react-select/dist/react-select.css';

const LIMIT = 100;
const MINIMUM_AGE = 24 * 60 * 60 / 50;

class App extends Component {
    render() {
        return (
            <Router>
                <header>
                    <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
                        <div className="collapse navbar-collapse" id="navbarsExampleDefault">
                            <ul className="navbar-nav mr-auto">
                                <li className="nav-item">
                                    {/*<Link to="/" className="nav-link">Home</Link>*/}
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
        return (project.time_submitted < parseInt(Date.now() / 1000 - MINIMUM_AGE, 10));
    }

    static isActive(project) {
        return project.status.toLowerCase() === 'active';
    }

    static isNotLocal(project) {
        return !project.local;
    }

    start(project) {
        if (!this.constructor.isActive(project)) {
            this.invalidEntries++;
            return false;
        }
        if (!this.constructor.isMaturedEnough(project)) {
            this.invalidEntries++;
            return false;
        }
        if (!this.constructor.isNotLocal(project)) {
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

    static countries(source) {
        return axios.get(`./countries/${source}.json`);
    }
}

class Projects extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: {},
            projects: [],
            offset: 0,
            isCountriesLoaded: false,
            countries: [],
            freelancerCountries: [],
            selectedCountries: [],
        };
    }

    loadCountries = () => {
        return axios.all([Request.countries('restcountries'), Request.countries('freelancer')])
            .then(axios.spread((countries, freelancerCountries) => {
                this.setState({
                    isCountriesLoaded: true,
                    countries: countries.data,
                    freelancerCountries: freelancerCountries.data.result.countries,
                });
                return freelancerCountries.data.result.countries;
            }))
            .catch((error) => {
                console.error(error);
            });
    };

    loadProjectsFromServer() {
        let url = `https://www.freelancer.com/api/projects/0.1/projects/active?`;
        url += `include_contests=true&`;
        url += `compact=true&`;
        url += `user_details=true&`;
        url += `limit=${LIMIT}&`;
        url += `offset=${this.state.offset}&`;
        for (let country of this.state.selectedCountries) {
            url += `countries[]=${country.code.toLowerCase()}&`;
        }

        axios.all([Request.projects(url), Request.projectsInReverseOrder(url)])
            .then(axios.spread((projectsInOrder, projectsInReverseOrder) => {
                const projectsData = merge(projectsInOrder, projectsInReverseOrder);
                if (projectsData.status === 200) {
                    let projects = projectsData.data;
                    const pageCount = Math.ceil(projects.result.total_count / LIMIT);
                    projects = new Filter(projects.result.projects);
                    console.error('invalidEntries: ', projects.invalidEntries);
                    projects = projects.projects;
                    projects.sort(function (project0, project1) {
                        const count0 = (project0.entry_count ? project0.entry_count : project0.bid_stats.bid_count);
                        const count1 = (project1.entry_count ? project1.entry_count : project1.bid_stats.bid_count);
                        return count0 - count1;
                    });

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
        this.loadCountries();
        // this.loadProjectsFromServer();
    }

    handlePageClick = (data) => {
        let selected = data.selected;
        let offset = Math.ceil(selected * LIMIT);

        this.setState({offset: offset}, () => {
            this.loadProjectsFromServer();
        });
    };

    selectCountry = (selectedCountries) => {
        this.setState({selectedCountries});
    };

    render() {
        let jobList = this.state.projects.map(function (jobNode, index) {
            return (
                <tr key={jobNode.id}>
                    <td>{index + 1}</td>
                    <td><a href={`https://www.freelancer.com/projects/${jobNode.seo_url}`}>{jobNode.title}</a></td>
                    <td>{jobNode.entry_count ? jobNode.entry_count : jobNode.bid_stats.bid_count}
                        {' X '} {jobNode.currency.code} {jobNode.entry_count ? 'ϕ' : parseInt(jobNode.bid_stats.bid_avg, 10)}</td>
                    <td>{(new Date(jobNode.time_submitted * 1000)).toISOString()}</td>
                    <td>{jobNode.currency.code} {jobNode.prize ? jobNode.prize : jobNode.budget.minimum}
                        - {jobNode.prize ? jobNode.prize : jobNode.budget.maximum}</td>
                </tr>
            );
        });
        return (
            <div className="container-fluid">
                <div className="row">
                    <main role="main" className="col-sm-12 ml-sm-auto col-md-12 pt-3">
                        <div className="row">
                            {this.state.isCountriesLoaded && <Select
                                multi={true}
                                name="countries"
                                value={this.state.selectedCountries}
                                labelKey="name"
                                valueKey="code"
                                onChange={this.selectCountry}
                                options={this.state.freelancerCountries}
                                closeOnSelect={true}
                            />}
                            <button type="button" class="btn btn-info" onClick={() => this.loadProjectsFromServer()}>
                                Search
                            </button>
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
                    </main>
                </div>
            </div>
        );
    }
}

export default App;
