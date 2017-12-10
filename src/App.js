import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Route,
} from 'react-router-dom';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import merge from 'deepmerge';
import Select from 'react-select';
import { Checkbox, CheckboxGroup } from 'react-checkbox-group';
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
                            <Route exact path="/" component={Projects}/>
                        </div>
                    </nav>
                </header>
            </Router>
        );
    }
}

function consoleError(text, count) {
    const consoleError = document.getElementById('console-error');
    const elm = consoleError.getElementsByClassName(text);
    if (elm.length) {
        const counter = elm[0].getElementsByClassName('counter')[0];
        counter.innerText = parseInt(counter.innerText, 10) + 1;
    } else {
        const li = document.createElement("li");
        li.className = text;
        if (count) {
            li.innerHTML = `${text}: <span class="counter">${count}</span>`;
        } else {
            li.innerHTML = `${text}: <span class="counter">1</span>`;
        }
        consoleError.appendChild(li);
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

    static isActive(project) {
        return project.status.toLowerCase() === 'active';
    }

    static isNotLocal(project) {
        return !project.local;
    }

    static isMaturedEnough(project) {
        return (project.time_submitted < parseInt(Date.now() / 1000 - MINIMUM_AGE, 10));
    }

    start(project) {
        if (!this.constructor.isActive(project)) {
            consoleError('closed');
            this.invalidEntries++;
            return false;
        }
        if (!this.constructor.isNotLocal(project)) {
            consoleError('local');
            this.invalidEntries++;
            return false;
        }
        if (!this.constructor.isMaturedEnough(project)) {
            consoleError('new');
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
            projectTypes: ['fixed', 'hourly', 'contests'],
        };
    };

    changedProjectTypes = (projectTypes) => {
        this.setState({
            projectTypes
        });
    };

    loadCountries = () => {
        return axios.all([Request.countries('restcountries'), Request.countries('above-average')])
            .then(axios.spread((countries, freelancerCountries) => {
                this.setState({
                    isCountriesLoaded: true,
                    countries: countries.data,
                    freelancerCountries: [{
                        "code": "WORLD",
                        "name": "World",
                    }, ...freelancerCountries.data.result.countries],
                });
                return freelancerCountries.data.result.countries;
            }))
            .catch((error) => {
                consoleError(error);
            });
    };

    loadProjectsFromServer() {
        document.getElementById('console-error').innerHTML = null;

        let url = `https://www.freelancer.com/api/projects/0.1/projects/active?`;
        if (this.state.projectTypes.includes('fixed')) {
            url += `project_types[]=fixed&`;
        }
        if (this.state.projectTypes.includes('hourly')) {
            url += `project_types[]=hourly&`;
        }
        if (this.state.projectTypes.includes('contests')) {
            url += `include_contests=true&`;
        }
        url += `compact=true&`;
        url += `user_details=true&`;
        url += `limit=${LIMIT}&`;
        url += `offset=${this.state.offset}&`;

        let countries = this.state.selectedCountries;
        const world = countries.filter(function (obj) {
            return obj.code === 'WORLD';
        })[0];

        if (world) {
            countries = this.state.freelancerCountries;
        }
        for (let country of countries) {
            url += `countries[]=${country.code.toLowerCase()}&`;
        }

        axios.all([Request.projects(url), Request.projectsInReverseOrder(url)])
            .then(axios.spread((projectsInOrder, projectsInReverseOrder) => {
                const projectsData = merge(projectsInOrder, projectsInReverseOrder);
                if (projectsData.status === 200) {
                    const data = projectsData.data;
                    const pageCount = Math.ceil((data.result.total_count / LIMIT) / 2);
                    let projects = new Filter(data.result.projects);
                    consoleError('invalidEntries', projects.invalidEntries);
                    projects = projects.projects;
                    projects.sort(function (project0, project1) {
                        const count0 = (project0.entry_count ? project0.entry_count : project0.bid_stats.bid_count);
                        const count1 = (project1.entry_count ? project1.entry_count : project1.bid_stats.bid_count);
                        return count0 - count1;
                    });
                    const users = data.result.users;

                    this.setState({
                        projects,
                        pageCount,
                        users,
                    });
                } else {
                    consoleError(projectsData.status);
                }
            }))
            .catch((error) => {
                consoleError(error);
            });
    }

    componentDidMount() {
        document.addEventListener("keydown", (zEvent) => {
            console.error(zEvent)
            if (zEvent.altKey && zEvent.code === "ArrowRight") {
                const nexts = document.querySelectorAll('.next a');
                for (let i = 0; i < nexts.length; i++) {
                    nexts[i].click();
                }
            } else if (zEvent.altKey && zEvent.code === "ArrowLeft") {
                const previouses = document.querySelectorAll('.previous a');
                for (let i = 0; i < previouses.length; i++) {
                    previouses[i].click();
                }
            }
        });

        this.loadCountries();
    }

    handlePageClick = (data) => {
        let selected = data.selected;
        let offset = Math.ceil(selected * LIMIT);

        this.setState({ offset: offset }, () => {
            this.loadProjectsFromServer();
        });
    };

    selectCountry = (selectedCountries) => {
        this.setState({ selectedCountries });
    };

    render() {
        let jobList = this.state.projects.map((jobNode, index) => {
            return (
                <tr key={jobNode.id}>
                    <td>{index + 1}</td>
                    <td>
                        {this.state.users[jobNode.owner_id].location.country.name}
                    </td>
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
            <main role="main" className="container">
                <div className="row">
                    <div className="row">
                        Filters:
                        <ul>
                            <li>Active</li>
                            <li>Posted at-least half an hour ago</li>
                            <li>Is not local</li>
                        </ul>
                    </div>
                    <form>
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
                                placeholder="Countries"
                            />}
                        </div>
                        <div className={"row"}>
                            <fieldset>
                                <legend>Projects Type</legend>
                                <CheckboxGroup
                                    name="project_types"
                                    value={this.state.projectTypes}
                                    onChange={this.changedProjectTypes}>
                                    <label><Checkbox value="fixed"/> Fixed</label>
                                    <label><Checkbox value="hourly"/> Hourly</label>
                                    <label><Checkbox value="contests"/> Contest</label>
                                </CheckboxGroup>
                            </fieldset>
                        </div>
                        <div className="row">
                            <button type="button" className="btn btn-info"
                                    onClick={() => this.loadProjectsFromServer()}>
                                Search
                            </button>
                        </div>
                        <div className="row">
                            <ul id={"console-error"} style={{ color: 'red' }}>
                            </ul>
                        </div>
                        <div className="row">
                            <p>May use alt/option + left/right arrows for paginating <br/></p>
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
                                           activeClassName={"active"}
                            />
                        </div>
                    </form>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>C</th>
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
                                   activeClassName={"active"}
                    />
                </div>
                <footer className="footer">
                    <div className="container">
                        <span className="text-muted"><a href="https://stackoverflow.com/story/itsazzad" target="_blank"
                                                        rel="noopener noreferrer">Sazzad Hossain Khan</a></span>
                    </div>
                </footer>
            </main>
        );
    }
}

export default App;
